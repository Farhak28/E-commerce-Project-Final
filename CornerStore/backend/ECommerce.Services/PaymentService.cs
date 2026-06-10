using AutoMapper;
using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.BasketModule;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.BasketDTOs;
using Microsoft.Extensions.Configuration;
using Stripe;
using Product = ECommerce.Domain.Entities.ProductModule.Product;

namespace ECommerce.Services;

public class PaymentService : IPaymentService
{
    private const long MinAmountCents = 50;

    private readonly IBasketRepository _basketRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly IMapper _mapper;
    private readonly IOrderFulfillmentService _fulfillment;

    public PaymentService(
        IBasketRepository basketRepository,
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        IMapper mapper,
        IOrderFulfillmentService fulfillment
    )
    {
        _basketRepository = basketRepository;
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _mapper = mapper;
        _fulfillment = fulfillment;
    }

    private string? GetStripeSecretKey()
    {
        var skey = _configuration["Stripe:SKey"] ?? _configuration["Stripe:Skey"];
        if (string.IsNullOrWhiteSpace(skey) || skey.StartsWith("USE_ENV", StringComparison.OrdinalIgnoreCase))
            return null;
        return skey;
    }

    private string? GetStripePublishableKey()
    {
        var pkey =
            _configuration["Stripe:PublishableKey"]
            ?? _configuration["Stripe:PKey"]
            ?? Environment.GetEnvironmentVariable("STRIPE_PUBLISHABLE_KEY")
            ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
        if (string.IsNullOrWhiteSpace(pkey) || pkey.StartsWith("USE_ENV", StringComparison.OrdinalIgnoreCase))
            return null;
        return pkey;
    }

    public StripeConfigDTO GetStripeConfig()
    {
        var publishable = GetStripePublishableKey();
        if (publishable is not null && !publishable.StartsWith("pk_", StringComparison.Ordinal))
            publishable = null;
        return new StripeConfigDTO(publishable, GetStripeSecretKey() is not null);
    }

    private bool TryConfigureStripe()
    {
        var skey = GetStripeSecretKey();
        if (skey is null)
            return false;
        StripeConfiguration.ApiKey = skey;
        return true;
    }

    public async Task<Result<BasketDTO>> CreateOrUpdatePaymentIntentAsync(string basketId)
    {
        if (!TryConfigureStripe())
            return Error.Faliure(
                "Stripe.NotConfigured",
                "Stripe is not configured. Set Stripe:SKey in appsettings or environment variables."
            );

        var basket = await _basketRepository.GetBasketAsync(basketId);
        if (basket is null)
            return Error.NotFound("Basket not found");

        if (basket.DeliveryMethodId is null)
            return Error.Validation("Delivery method is not selected in the basket");

        var method = await _unitOfWork
            .GetRepository<DeliveryMethod, int>()
            .GetByIdAsync(basket.DeliveryMethodId.Value);

        if (method is null)
            return Error.NotFound("Delivery method not found");

        basket.ShippingPrice = ScheduledDeliveryPricing.Calculate(
            method.Price,
            basket.ScheduledDeliveryAt
        );

        foreach (var item in basket.Items)
        {
            var product = await _unitOfWork.GetRepository<Product, int>().GetByIdAsync(item.Id);

            if (product is null)
                return Error.NotFound("ProductItem.NotFound");

            item.Price = product.Price;
            item.ProductName = product.Name;
            item.PictureUrl = product.PictureUrl;
        }

        var orderTotal = basket.Items.Sum(I => I.Quantity * I.Price) + basket.ShippingPrice - basket.DiscountAmount;
        orderTotal = Math.Max(0, orderTotal);
        long amount = (long)(orderTotal * 100);

        if (amount < MinAmountCents)
            return Error.Validation(
                "Payment.AmountTooSmall",
                "Order total must be at least $0.50 USD for card payments."
            );

        var stripeService = new PaymentIntentService();
        var createOptions = new PaymentIntentCreateOptions
        {
            Amount = amount,
            Currency = "usd",
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions
            {
                Enabled = true,
            },
            Metadata = new Dictionary<string, string> { ["basketId"] = basketId },
        };

        try
        {
            if (string.IsNullOrWhiteSpace(basket.PaymentIntentID))
            {
                var paymentIntent = await stripeService.CreateAsync(createOptions);
                basket.PaymentIntentID = paymentIntent.Id;
                basket.ClientSecret = paymentIntent.ClientSecret;
            }
            else
            {
                var existing = await stripeService.GetAsync(basket.PaymentIntentID);
                if (CanReusePaymentIntent(existing.Status))
                {
                    if (existing.Amount != amount)
                    {
                        existing = await stripeService.UpdateAsync(
                            basket.PaymentIntentID,
                            new PaymentIntentUpdateOptions { Amount = amount }
                        );
                    }

                    basket.ClientSecret = existing.ClientSecret;
                }
                else
                {
                    var paymentIntent = await stripeService.CreateAsync(createOptions);
                    basket.PaymentIntentID = paymentIntent.Id;
                    basket.ClientSecret = paymentIntent.ClientSecret;
                }
            }
        }
        catch (StripeException ex)
        {
            return Error.Faliure("Stripe.Error", ex.StripeError?.Message ?? ex.Message);
        }

        if (string.IsNullOrWhiteSpace(basket.ClientSecret))
            return Error.Faliure("Stripe.NoClientSecret", "Could not initialize Stripe payment.");

        await _basketRepository.CreateOrUpdateBasketAsync(basket);

        return _mapper.Map<BasketDTO>(basket);
    }

    public async Task<Result> EnsurePaymentIntentSucceededAsync(string paymentIntentId)
    {
        if (!TryConfigureStripe())
            return Result.Fail(Error.Faliure("Stripe.NotConfigured", "Stripe is not configured."));

        if (string.IsNullOrWhiteSpace(paymentIntentId))
            return Result.Fail(
                Error.Validation(
                    "PaymentIntent.NotFound",
                    "Complete card or wallet payment before placing the order."
                )
            );

        try
        {
            var intent = await new PaymentIntentService().GetAsync(paymentIntentId);
            if (intent.Status == "succeeded")
                return Result.Ok();

            if (intent.Status is "processing" or "requires_capture")
                return Result.Ok();

            return Result.Fail(
                Error.Validation(
                    "Payment.NotCompleted",
                    intent.Status switch
                    {
                        "requires_payment_method" => "Payment was not completed. Please try again.",
                        "requires_confirmation" => "Payment needs confirmation. Return to the payment step.",
                        "requires_action" => "Additional authentication is required to finish payment.",
                        "canceled" => "Payment was canceled. Set up payment again.",
                        _ => $"Payment is not complete (status: {intent.Status}).",
                    }
                )
            );
        }
        catch (StripeException ex)
        {
            return Result.Fail(Error.Faliure("Stripe.Error", ex.Message));
        }
    }

    public async Task<Result<bool>> IsBasketPaymentCompleteAsync(string basketId)
    {
        var basket = await _basketRepository.GetBasketAsync(basketId);
        if (basket is null || string.IsNullOrWhiteSpace(basket.PaymentIntentID))
            return Result<bool>.Ok(false);

        var check = await EnsurePaymentIntentSucceededAsync(basket.PaymentIntentID);
        return check.IsSuccess ? Result<bool>.Ok(true) : Result<bool>.Ok(false);
    }

    private static bool CanReusePaymentIntent(string status) =>
        status is "requires_payment_method"
            or "requires_confirmation"
            or "requires_action"
            or "processing"
            or "succeeded";

    public async Task UpdateOrderPaymentStatus(string request, string stripeSignature)
    {
        var endPointSecret = _configuration["Stripe:EndpointSecret"];
        if (endPointSecret is null)
            return;

        var stripeEvent = EventUtility.ConstructEvent(request, stripeSignature, endPointSecret);

        if (stripeEvent.Data.Object is not PaymentIntent paymentIntent)
            return;

        var order = await _unitOfWork
            .GetRepository<Order, Guid>()
            .GetByIdAsync(new OrderWithPaymentIntentSpecifications(paymentIntent.Id));

        if (order is null)
            return;

        if (stripeEvent.Type == EventTypes.PaymentIntentSucceeded)
        {
            order.Status = OrderStatus.PaymentReceived;
            await _fulfillment.ConfirmPaymentAsync(order);

            _unitOfWork.GetRepository<Order, Guid>().Update(order);

            await _unitOfWork.SaveChangesAsync();
        }
        else if (stripeEvent.Type == EventTypes.PaymentIntentPaymentFailed)
        {
            order.Status = OrderStatus.PaymentFailed;
            _unitOfWork.GetRepository<Order, Guid>().Update(order);
            await _unitOfWork.SaveChangesAsync();
        }
        else
        {
            Console.WriteLine("Unhandled event type: {0}", stripeEvent.Type);
        }
    }
}

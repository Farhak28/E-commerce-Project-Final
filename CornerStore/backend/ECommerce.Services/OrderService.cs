using System;
using System.Buffers.Text;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.BasketModule;
using ECommerce.Domain.Entities.OrderModule;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Specifications.OrderSpecifications;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.OrderDTOs;
using Microsoft.AspNetCore.Http.HttpResults;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Model;

namespace ECommerce.Services
{
    public class OrderService : IOrderService
    {
        private readonly IMapper _mapper;
        private readonly IBasketRepository _basketRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly INotificationService _notificationService;
        private readonly IPaymentService _paymentService;
        private readonly IOrderFulfillmentService _fulfillment;
        private readonly ICouponService _couponService;

        public OrderService(
            IMapper mapper,
            IBasketRepository basketRepository,
            IUnitOfWork unitOfWork,
            INotificationService notificationService,
            IPaymentService paymentService,
            IOrderFulfillmentService fulfillment,
            ICouponService couponService
        )
        {
            _mapper = mapper;
            _basketRepository = basketRepository;
            _unitOfWork = unitOfWork;
            _notificationService = notificationService;
            _paymentService = paymentService;
            _fulfillment = fulfillment;
            _couponService = couponService;
        }

        public async Task<Result<OrderToReturnDTO>> CreateOrderAsync(
            OrderDTO orderDTO,
            string email
        )
        {
            //1- Maps the provided shipping address to the order address entity.
            var orderAddress = _mapper.Map<OrderAddress>(orderDTO.ShipToAddress);

            //2-Retrieves the basket and validates its existence.
            var basket = await _basketRepository.GetBasketAsync(orderDTO.BasketId);
            if (basket is null)
                return Error.NotFound(
                    "Basket.NotFound",
                    $"The basket with Id:{orderDTO.BasketId} is Not found"
                );

            //3-Creates a list of order items by fetching product details from the database and validating each product.
            List<OrderItem> orderItems = new List<OrderItem>();
            var productRepo = _unitOfWork.GetRepository<Product, int>();
            var stockLines = new List<(Product Product, int Quantity)>();

            foreach (var item in basket.Items)
            {
                var product = await productRepo.GetByIdAsync(item.Id);
                if (product is null)
                    return Error.NotFound(
                        "Product.NotFound",
                        $"The product with Id:{item.Id} is Not found"
                    );
                stockLines.Add((product, item.Quantity));
                orderItems.Add(CreateOrderItem(item, product));
            }

            //4-Retrieves the selected delivery method and validates its existence.
            var deliveryMethod = await _unitOfWork
                .GetRepository<DeliveryMethod, int>()
                .GetByIdAsync(orderDTO.DeliveryMethodId);
            if (deliveryMethod is null)
                return Error.NotFound(
                    "DeliveryMethod.NotFound",
                    $"The Delivery Method with this Id:{orderDTO.DeliveryMethodId} is Not Found "
                );
            //5-Calculates the subtotal of the order based on the items and their quantities.
            var SubTotal = orderItems.Sum(X => X.Price * X.Quantity);

            string paymentIntentId;
            OrderStatus orderStatus;
            OrderPaymentMethod orderPaymentMethod;
            string notificationTitle = "Order confirmed";
            string notificationBody;

            switch (orderDTO.PaymentMethod)
            {
                case CheckoutPaymentMethod.Card:
                case CheckoutPaymentMethod.ApplePay:
                    orderPaymentMethod = OrderPaymentLabels.ToDomain(orderDTO.PaymentMethod);
                    if (string.IsNullOrWhiteSpace(basket.PaymentIntentID))
                        return Error.Validation(
                            "PaymentIntent.NotFound",
                            "Complete card or wallet payment before placing the order."
                        );
                    var paymentCheck = await _paymentService.EnsurePaymentIntentSucceededAsync(
                        basket.PaymentIntentID
                    );
                    if (!paymentCheck.IsSuccess)
                        return Result<OrderToReturnDTO>.Fail(paymentCheck.Errors.ToList());
                    paymentIntentId = basket.PaymentIntentID;
                    orderStatus = OrderStatus.PaymentReceived;
                    notificationBody = "Your order was placed and payment was received.";
                    break;

                case CheckoutPaymentMethod.InstaPay:
                    orderPaymentMethod = OrderPaymentMethod.InstaPay;
                    paymentIntentId = $"instapay-{Guid.NewGuid():N}";
                    orderStatus = OrderStatus.Pending;
                    notificationTitle = "Order placed";
                    notificationBody =
                        "Your order was placed. Complete your InstaPay transfer to confirm payment.";
                    break;

                case CheckoutPaymentMethod.CashOnDelivery:
                    orderPaymentMethod = OrderPaymentMethod.CashOnDelivery;
                    paymentIntentId = $"cod-{Guid.NewGuid():N}";
                    orderStatus = OrderStatus.Pending;
                    notificationTitle = "Order placed";
                    notificationBody =
                        "Your order was placed. Pay cash when your delivery arrives.";
                    break;

                default:
                    return Error.Validation(
                        "PaymentMethod.Invalid",
                        "Select a valid payment method."
                    );
            }

            var orderRepo = _unitOfWork.GetRepository<Order, Guid>();
            Order? existingOrder = null;
            if (!string.IsNullOrWhiteSpace(basket.PaymentIntentID))
            {
                var orderSpec = new OrderWithPaymentIntentSpecifications(basket.PaymentIntentID);
                existingOrder = await orderRepo.GetByIdAsync(orderSpec);
                if (existingOrder is not null)
                {
                    if (existingOrder.StockDeducted)
                        await RestoreStockFromOrderItemsAsync(existingOrder.Items);
                    orderRepo.Delete(existingOrder);
                }
            }

            await RefreshStockQuantitiesAsync(stockLines);

            var stockValidation = ValidateStockAvailability(stockLines);
            if (stockValidation is not null)
                return stockValidation;

            DateTimeOffset? scheduledDeliveryAt = null;
            if (orderDTO.ScheduledDeliveryAt.HasValue)
            {
                var scheduleCheck = OrderActionRules.ValidateScheduledDelivery(
                    orderDTO.ScheduledDeliveryAt.Value
                );
                if (!scheduleCheck.IsSuccess)
                    return Result<OrderToReturnDTO>.Fail(scheduleCheck.Errors.ToList());
                scheduledDeliveryAt = orderDTO.ScheduledDeliveryAt.Value;
            }

            var deliveryPrice = ScheduledDeliveryPricing.Calculate(
                deliveryMethod.Price,
                scheduledDeliveryAt
            );

            var couponCode = !string.IsNullOrWhiteSpace(orderDTO.CouponCode)
                ? orderDTO.CouponCode
                : basket.CouponCode;

            decimal discountAmount = 0;
            if (!string.IsNullOrWhiteSpace(couponCode))
            {
                var discountResult = await _couponService.ValidateForOrderAsync(
                    email,
                    couponCode,
                    SubTotal,
                    deliveryPrice
                );
                if (!discountResult.IsSuccess)
                    return Result<OrderToReturnDTO>.Fail(discountResult.Errors.ToList());
                discountAmount = discountResult.Value;
            }

            //6-Creates a new Order with all relevant details.
            var order = new Order()
            {
                UserEmail = email,
                Address = orderAddress,
                DeliveryMethod = deliveryMethod,
                PaymentIntentId = paymentIntentId,
                PaymentMethod = orderPaymentMethod,
                Status = orderStatus,
                SubTotal = SubTotal,
                DeliveryPrice = deliveryPrice,
                CouponCode = couponCode?.Trim().ToUpperInvariant(),
                DiscountAmount = discountAmount,
                Items = orderItems,
                ScheduledDeliveryAt = scheduledDeliveryAt,
            };

            DeductStock(stockLines);
            order.StockDeducted = true;
            await _fulfillment.InitializeNewOrderAsync(order);
            await orderRepo.AddAsync(order);

            bool result = await _unitOfWork.SaveChangesAsync() > 0;
            if (!result)
                return Error.Faliure("Order.Faliure", "There was a problem while creating the order");

            if (!string.IsNullOrWhiteSpace(couponCode))
            {
                var redeem = await _couponService.RedeemAsync(
                    email,
                    couponCode,
                    order.Id,
                    SubTotal,
                    deliveryPrice
                );
                if (!redeem.IsSuccess)
                    return Result<OrderToReturnDTO>.Fail(redeem.Errors.ToList());
                order.UserCouponId = redeem.Value.Id;
                orderRepo.Update(order);
                await _unitOfWork.SaveChangesAsync();
            }

            basket.CouponCode = null;
            basket.DiscountAmount = 0;
            await _basketRepository.CreateOrUpdateBasketAsync(basket);

            notificationBody =
                $"{notificationBody} Order #{order.Id.ToString()[..8]} — track under Account → Orders.";

            await _notificationService.CreateForUserAsync(
                email,
                notificationTitle,
                notificationBody,
                "orders"
            );

            //7-Returns a DTO containing the full order details to the client,
            //including Id[OrderId], UserEmail,
            //items[ProductName, PictureUrl, Price, Quantity], address, delivery method[ShortName],
            //order status, OrderDate, subtotal, and total price

            return _mapper.Map<OrderToReturnDTO>(order);
        }

        public async Task<Result<IEnumerable<DeliveryMethodDTO>>> GetAllDeliveryMethodsAsync()
        {
            var deliveryMethods = await _unitOfWork
                .GetRepository<DeliveryMethod, int>()
                .GetAllAsync();

            if (!deliveryMethods.Any())
                return Error.NotFound("DeliveryMethods.NotFound", "No Delivery Methods Found");

            var data = _mapper.Map<IEnumerable<DeliveryMethod>, IEnumerable<DeliveryMethodDTO>>(
                deliveryMethods
            );

            if (data is null)
                return Error.NotFound("DeliveryMethods.NotFound", "No Delivery Methods Found");

            return Result<IEnumerable<DeliveryMethodDTO>>.Ok(data);
        }

        public async Task<Result<DeliveryQuoteDTO>> GetDeliveryQuoteAsync(
            int deliveryMethodId,
            DateTimeOffset? scheduledDeliveryAt
        )
        {
            if (scheduledDeliveryAt.HasValue)
            {
                var scheduleCheck = OrderActionRules.ValidateScheduledDelivery(
                    scheduledDeliveryAt.Value
                );
                if (!scheduleCheck.IsSuccess)
                    return Result<DeliveryQuoteDTO>.Fail(scheduleCheck.Errors.ToList());
            }

            var deliveryMethod = await _unitOfWork
                .GetRepository<DeliveryMethod, int>()
                .GetByIdAsync(deliveryMethodId);
            if (deliveryMethod is null)
                return Error.NotFound(
                    "DeliveryMethod.NotFound",
                    $"The Delivery Method with this Id:{deliveryMethodId} is Not Found "
                );

            return ScheduledDeliveryPricing.BuildQuote(
                deliveryMethod.Id,
                deliveryMethod.ShortName,
                deliveryMethod.Price,
                scheduledDeliveryAt
            );
        }

        public async Task<Result<IEnumerable<OrderToReturnDTO>>> GetAllOrdersAsync(string email)
        {
            var OrderSpec = new OrderSpecification(email);
            var orders = await _unitOfWork.GetRepository<Order, Guid>().GetAllAsync(OrderSpec);

            if (!orders.Any())
                return Error.NotFound(
                    "Orders.NotFound",
                    $"No Orders Found for the user with email:{email}"
                );

            var Data = _mapper.Map<IEnumerable<Order>, IEnumerable<OrderToReturnDTO>>(orders);

            return Result<IEnumerable<OrderToReturnDTO>>.Ok(Data);
        }

        public async Task<Result<OrderToReturnDTO>> GetOrderByIdAsync(Guid Id, string email)
        {
            var orderSpec = new OrderSpecification(Id, email);
            var order = await _unitOfWork.GetRepository<Order, Guid>().GetByIdAsync(orderSpec);

            if (order is null)
                return Error.NotFound(
                    "Order.NotFound",
                    $"No Order Found with Id:{Id} for the user with email:{email}"
                );

            var data = _mapper.Map<Order, OrderToReturnDTO>(order);

            return Result<OrderToReturnDTO>.Ok(data);
        }

        public async Task<Result<OrderToReturnDTO>> CancelOrderAsync(Guid id, string email)
        {
            var order = await GetOwnedOrderAsync(id, email);
            if (order is null)
                return Error.NotFound("Order.NotFound", $"No order found with Id:{id}.");

            if (!OrderActionRules.CanCancel(order))
                return Error.Validation(
                    "Order.CannotCancel",
                    "This order can no longer be cancelled."
                );

            order.Status = OrderStatus.Cancelled;
            order.CancelledAt = DateTimeOffset.UtcNow;
            _fulfillment.MarkCancelled(order);

            if (order.StockDeducted)
            {
                await RestoreStockFromOrderItemsAsync(order.Items);
                order.StockDeducted = false;
            }

            _unitOfWork.GetRepository<Order, Guid>().Update(order);
            if (await _unitOfWork.SaveChangesAsync() <= 0)
                return Error.Faliure("Order.CancelFailed", "Could not cancel the order.");

            await _notificationService.CreateForUserAsync(
                email,
                "Order cancelled",
                $"Order #{order.Id.ToString()[..8]} was cancelled.",
                "orders"
            );

            return _mapper.Map<OrderToReturnDTO>(order);
        }

        public async Task<Result<OrderToReturnDTO>> RequestReturnAsync(
            Guid id,
            string email,
            ReturnOrderDTO dto
        )
        {
            if (string.IsNullOrWhiteSpace(dto.Reason))
                return Error.Validation("Return.ReasonRequired", "Please provide a return reason.");

            var order = await GetOwnedOrderAsync(id, email);
            if (order is null)
                return Error.NotFound("Order.NotFound", $"No order found with Id:{id}.");

            if (!OrderActionRules.CanReturn(order))
                return Error.Validation(
                    "Order.CannotReturn",
                    "This order is not eligible for return. Returns are available within 14 days of confirmed orders."
                );

            order.Status = OrderStatus.ReturnRequested;
            order.ReturnReason = dto.Reason.Trim();
            order.ReturnRequestedAt = DateTimeOffset.UtcNow;
            _fulfillment.MarkReturnRequested(order);

            _unitOfWork.GetRepository<Order, Guid>().Update(order);
            if (await _unitOfWork.SaveChangesAsync() <= 0)
                return Error.Faliure("Order.ReturnFailed", "Could not submit the return request.");

            await _notificationService.CreateForUserAsync(
                email,
                "Return requested",
                $"We received your return request for order #{order.Id.ToString()[..8]}. Our team will follow up shortly.",
                "orders"
            );

            return _mapper.Map<OrderToReturnDTO>(order);
        }

        public async Task<Result<OrderToReturnDTO>> ScheduleOrderAsync(
            Guid id,
            string email,
            ScheduleOrderDTO dto
        )
        {
            var scheduleCheck = OrderActionRules.ValidateScheduledDelivery(dto.ScheduledDeliveryAt);
            if (!scheduleCheck.IsSuccess)
                return Result<OrderToReturnDTO>.Fail(scheduleCheck.Errors.ToList());

            var order = await GetOwnedOrderAsync(id, email);
            if (order is null)
                return Error.NotFound("Order.NotFound", $"No order found with Id:{id}.");

            if (!OrderActionRules.CanSchedule(order))
                return Error.Validation(
                    "Order.CannotSchedule",
                    "This order can no longer be rescheduled."
                );

            order.ScheduledDeliveryAt = dto.ScheduledDeliveryAt;
            order.DeliveryPrice = ScheduledDeliveryPricing.Calculate(
                order.DeliveryMethod.Price,
                dto.ScheduledDeliveryAt
            );

            _unitOfWork.GetRepository<Order, Guid>().Update(order);
            if (await _unitOfWork.SaveChangesAsync() <= 0)
                return Error.Faliure("Order.ScheduleFailed", "Could not update the delivery schedule.");

            await _notificationService.CreateForUserAsync(
                email,
                "Delivery scheduled",
                $"Order #{order.Id.ToString()[..8]} is scheduled for {dto.ScheduledDeliveryAt:MMM d, yyyy h:mm tt}. Delivery cost updated to ${order.DeliveryPrice:0.00}.",
                "orders"
            );

            return _mapper.Map<OrderToReturnDTO>(order);
        }

        private async Task<Order?> GetOwnedOrderAsync(Guid id, string email)
        {
            var orderSpec = new OrderSpecification(id, email);
            return await _unitOfWork.GetRepository<Order, Guid>().GetByIdAsync(orderSpec);
        }

        private OrderItem CreateOrderItem(BasketItem item, Product product)
        {
            return new OrderItem()
            {
                Product = new ProductItemOrdered()
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    PictureUrl = product.PictureUrl,
                },
                Price = product.Price,
                Quantity = item.Quantity,
            };
        }

        private static Result<OrderToReturnDTO>? ValidateStockAvailability(
            IReadOnlyList<(Product Product, int Quantity)> lines
        )
        {
            foreach (var (product, quantity) in lines)
            {
                if (quantity <= 0)
                    return Error.Validation(
                        "Basket.InvalidQuantity",
                        $"Invalid quantity for {product.Name}."
                    );

                if (product.StockQuantity < quantity)
                    return Error.Validation(
                        "Product.InsufficientStock",
                        $"Insufficient stock for {product.Name}. Available: {product.StockQuantity}, requested: {quantity}."
                    );
            }

            return null;
        }

        private void DeductStock(IReadOnlyList<(Product Product, int Quantity)> lines)
        {
            var productRepo = _unitOfWork.GetRepository<Product, int>();
            foreach (var (product, quantity) in lines)
            {
                product.StockQuantity -= quantity;
                productRepo.Update(product);
            }
        }

        private async Task RestoreStockFromOrderItemsAsync(ICollection<OrderItem> items)
        {
            if (items is null || items.Count == 0)
                return;

            var productRepo = _unitOfWork.GetRepository<Product, int>();
            foreach (var item in items)
            {
                var product = await productRepo.GetByIdAsync(item.Product.ProductId);
                if (product is null)
                    continue;

                product.StockQuantity += item.Quantity;
                productRepo.Update(product);
            }
        }

        private async Task RefreshStockQuantitiesAsync(List<(Product Product, int Quantity)> lines)
        {
            var productRepo = _unitOfWork.GetRepository<Product, int>();
            for (var i = 0; i < lines.Count; i++)
            {
                var refreshed = await productRepo.GetByIdAsync(lines[i].Product.Id);
                if (refreshed is not null)
                    lines[i] = (refreshed, lines[i].Quantity);
            }
        }
    }
}

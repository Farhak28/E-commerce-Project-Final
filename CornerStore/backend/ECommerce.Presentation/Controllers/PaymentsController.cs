using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.BasketDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace ECommerce.Presentation.Controllers
{
    public class PaymentsController : ApiBaseController
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpGet("stripe-config")]
        [AllowAnonymous]
        public ActionResult<StripeConfigDTO> GetStripeConfig()
        {
            return Ok(_paymentService.GetStripeConfig());
        }

        // POST: baseUrl/api/payments/{basketId}

        [HttpPost("{BasketId}")]
        public async Task<ActionResult<BasketDTO>> CreateOrUpdatePaymentIntent(string BasketId)
        {
            var result = await _paymentService.CreateOrUpdatePaymentIntentAsync(BasketId);
            return HandleResult(result);
        }

        [HttpGet("{BasketId}/payment-status")]
        public async Task<ActionResult<bool>> GetPaymentStatus(string BasketId)
        {
            var result = await _paymentService.IsBasketPaymentCompleteAsync(BasketId);
            return HandleResult(result);
        }

        [HttpPost("webhook")]
        public async Task<IActionResult> WebHook()
        {
            var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
            var stripeSignature = Request.Headers["Stripe-Signature"];

            await _paymentService.UpdateOrderPaymentStatus(json, stripeSignature!);
            return new EmptyResult();
        }
    }
}

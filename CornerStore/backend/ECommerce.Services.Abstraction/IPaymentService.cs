using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.BasketDTOs;

namespace ECommerce.Services.Abstraction
{
    public interface IPaymentService
    {
        StripeConfigDTO GetStripeConfig();

        Task<Result<BasketDTO>> CreateOrUpdatePaymentIntentAsync(string basketId);

        /// <summary>Returns success when the PaymentIntent is succeeded (card/wallet checkout complete).</summary>
        Task<Result> EnsurePaymentIntentSucceededAsync(string paymentIntentId);

        Task<Result<bool>> IsBasketPaymentCompleteAsync(string basketId);

        Task UpdateOrderPaymentStatus(string request, string stripeSignature);
    }
}

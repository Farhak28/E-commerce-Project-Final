using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Services.Specifications;

namespace ECommerce.Services.Specifications.ReviewSpecifications
{
    internal class ReviewsByProductSpecification : BaseSpecifications<Review, int>
    {
        public ReviewsByProductSpecification(int productId)
            : base(r => r.ProductId == productId)
        {
            AddOrderByDescending(r => r.CreatedAt);
        }
    }
}

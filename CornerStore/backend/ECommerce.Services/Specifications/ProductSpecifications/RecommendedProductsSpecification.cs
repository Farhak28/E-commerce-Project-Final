using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Services.Specifications;

namespace ECommerce.Services.Specifications.ProductSpecifications
{
    internal class RecommendedProductsSpecification : BaseSpecifications<Product, int>
    {
        public RecommendedProductsSpecification(Product sourceProduct, int pageSize = 5)
            : base(p =>
                p.Id != sourceProduct.Id
                && (p.ProductBrandId == sourceProduct.ProductBrandId
                    || p.ProductTypeId == sourceProduct.ProductTypeId)
            )
        {
            AddInclude(p => p.ProductBrand);
            AddInclude(p => p.ProductType);
            AddInclude(p => p.Reviews);
            AddOrderByDescending(p => p.ProductTypeId == sourceProduct.ProductTypeId ? 1 : 0);
            AddOrderByDescending(p => p.Reviews.Count);
            AddOrderByDescending(p => p.Price);
            ApplyPagination(pageSize, 1);
        }
    }
}

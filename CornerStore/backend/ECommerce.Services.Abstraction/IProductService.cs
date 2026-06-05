using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Shared;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;
using ECommerce.Shared.DTOs.ReviewDTOs;

namespace ECommerce.Services.Abstraction
{
    public interface IProductService
    {
        Task<PaginatedResult<ProductDTO>> GetAllProductsAsync(ProductQueryParams queryParams);

        Task<IReadOnlyList<ProductDTO>> GetAllProductsForAdminAsync();

        Task<AdminPagedResult<ProductDTO>> GetProductsForAdminPagedAsync(AdminListQueryParams queryParams);

        Task<Result<ProductDTO>> GetProductByIdAsync(int id);

        Task<IEnumerable<BrandDTO>> GetAllBrandsAsync();

        Task<IEnumerable<TypeDTO>> GetAllTypesAsync();

        Task<IEnumerable<ProductDTO>> GetRecommendedProductsAsync(int productId, int count = 5);

        Task<IEnumerable<ReviewDTO>> GetReviewsByProductIdAsync(int productId);

        Task<Result<ReviewDTO>> AddReviewAsync(int productId, string userName, CreateReviewDTO createReviewDto);

        Task<Result<ProductDTO>> CreateProductAsync(CreateProductDTO dto);

        Task<Result<ProductDTO>> UpdateProductAsync(int id, UpdateProductDTO dto);

        Task<Result> DeleteProductAsync(int id);
    }
}

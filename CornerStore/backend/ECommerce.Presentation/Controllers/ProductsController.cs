using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Presentation.Attributes;
using ECommerce.Services.Abstraction;
using ECommerce.Shared.DTOs.AIDTOs;
using ECommerce.Shared;
using ECommerce.Shared.DTOs.ProductDTOs;
using ECommerce.Shared.DTOs.ReviewDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers
{
    public class ProductsController : ApiBaseController
    {
        private readonly IProductService _productService;
        private readonly IReviewSummaryService _reviewSummary;

        public ProductsController(IProductService productService, IReviewSummaryService reviewSummary)
        {
            _productService = productService;
            _reviewSummary = reviewSummary;
        }

        //Get All Products
        [HttpGet]
        //GET:baseUrl/api/Products
        [RedisCache]
        public async Task<ActionResult<PaginatedResult<ProductDTO>>> GetAllProducts(
            [FromQuery] ProductQueryParams queryParams
        )
        {
            var products = await _productService.GetAllProductsAsync(queryParams);

            return Ok(products);
        }

        [HttpGet("{id}")]
        //GET:BaseUrl/api/Products/1
        public async Task<ActionResult<ProductDTO>> GetProduct(int id)
        {
            var result = await _productService.GetProductByIdAsync(id);

            return HandleResult<ProductDTO>(result);
        }

        [HttpGet("brands")]
        //GET:BaseUrl/api/Products/brands
        public async Task<ActionResult<IEnumerable<BrandDTO>>> GetAllBrands()
        {
            var brands = await _productService.GetAllBrandsAsync();
            return Ok(brands);
        }

        //GET:BaseUrl/api/Products/types
        [HttpGet("types")]
        public async Task<ActionResult<IEnumerable<TypeDTO>>> GetAllTypes()
        {
            var types = await _productService.GetAllTypesAsync();
            return Ok(types);
        }

        [HttpGet("{id}/recommendations")]
        public async Task<ActionResult<IEnumerable<ProductDTO>>> GetRecommendedProducts(int id)
        {
            var products = await _productService.GetRecommendedProductsAsync(id);
            return Ok(products);
        }

        [HttpGet("{id}/reviews")]
        public async Task<ActionResult<IEnumerable<ReviewDTO>>> GetProductReviews(int id)
        {
            var reviews = await _productService.GetReviewsByProductIdAsync(id);
            return Ok(reviews);
        }

        [HttpGet("{id}/review-summary")]
        public async Task<ActionResult<ReviewSummaryDTO>> GetProductReviewSummary(int id)
        {
            var summary = await _reviewSummary.GetSummaryAsync(id);
            if (summary is null)
                return NotFound();
            return Ok(summary);
        }

        [HttpPost("{id}/reviews")]
        public async Task<ActionResult<ReviewDTO>> AddProductReview(
            int id,
            [FromBody] CreateReviewDTO createReviewDto
        )
        {
            var userName = User?.Identity?.Name ?? createReviewDto.UserName ?? "Guest";
            var result = await _productService.AddReviewAsync(id, userName, createReviewDto);
            return HandleResult<ReviewDTO>(result);
        }
    }
}

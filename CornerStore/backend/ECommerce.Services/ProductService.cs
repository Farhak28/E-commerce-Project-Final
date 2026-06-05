using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using AutoMapper;
using ECommerce.Domain.Contracts;
using ECommerce.Domain.Entities.ProductModule;
using ECommerce.Services.Abstraction;
using ECommerce.Services.Exceptions;
using ECommerce.Services.Specifications.ProductSpecifications;
using ECommerce.Services.Specifications.ReviewSpecifications;
using ECommerce.Shared;
using ECommerce.Shared.CommonResponses;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.ProductDTOs;
using ECommerce.Shared.DTOs.ReviewDTOs;

namespace ECommerce.Services
{
    public class ProductService : IProductService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly ICacheService _cacheService;

        public ProductService(IUnitOfWork unitOfWork, IMapper mapper, ICacheService cacheService)
        {
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _cacheService = cacheService;
        }

        public async Task<IEnumerable<BrandDTO>> GetAllBrandsAsync()
        {
            var Brands = await _unitOfWork.GetRepository<ProductBrand, int>().GetAllAsync();

            return _mapper.Map<IEnumerable<BrandDTO>>(Brands);
        }

        public async Task<PaginatedResult<ProductDTO>> GetAllProductsAsync(
            ProductQueryParams queryParams
        )
        {
            var repo = _unitOfWork.GetRepository<Product, int>();
            var spec = new ProductWithTypeAndBrandSpecification(queryParams);
            var products = await repo.GetAllAsync(spec);

            var productWithCountSpec = new ProductWithCountSpecifications(queryParams);
            var TotalCount = await repo.CountAsync(productWithCountSpec);
            var DataToReturn = _mapper.Map<IEnumerable<ProductDTO>>(products);

            var countOfReturnedData = DataToReturn.Count();

            return new PaginatedResult<ProductDTO>(
                queryParams.PageIndex,
                countOfReturnedData,
                TotalCount,
                DataToReturn
            );
        }

        public async Task<IReadOnlyList<ProductDTO>> GetAllProductsForAdminAsync()
        {
            var spec = new ProductWithTypeAndBrandSpecification();
            var products = await _unitOfWork.GetRepository<Product, int>().GetAllAsync(spec);
            return _mapper.Map<IReadOnlyList<ProductDTO>>(products);
        }

        public async Task<AdminPagedResult<ProductDTO>> GetProductsForAdminPagedAsync(AdminListQueryParams queryParams)
        {
            var spec = new ProductWithTypeAndBrandSpecification();
            var products = (await _unitOfWork.GetRepository<Product, int>().GetAllAsync(spec)).AsEnumerable();

            if (!string.IsNullOrWhiteSpace(queryParams.Search))
            {
                var term = queryParams.Search.Trim();
                products = products.Where(p =>
                    p.Name.Contains(term, StringComparison.OrdinalIgnoreCase)
                    || p.Description.Contains(term, StringComparison.OrdinalIgnoreCase)
                    || p.ProductBrand.Name.Contains(term, StringComparison.OrdinalIgnoreCase)
                    || p.ProductType.Name.Contains(term, StringComparison.OrdinalIgnoreCase)
                );
            }

            var list = products.ToList();
            var page = Math.Max(1, queryParams.Page);
            var pageSize = Math.Clamp(queryParams.PageSize, 1, 100);
            var slice = list.Skip((page - 1) * pageSize).Take(pageSize);
            return new AdminPagedResult<ProductDTO>(
                _mapper.Map<IReadOnlyList<ProductDTO>>(slice),
                list.Count,
                page,
                pageSize
            );
        }

        public async Task<IEnumerable<TypeDTO>> GetAllTypesAsync()
        {
            var types = await _unitOfWork.GetRepository<ProductType, int>().GetAllAsync();

            return _mapper.Map<IEnumerable<TypeDTO>>(types);
        }

        public async Task<Result<ProductDTO>> GetProductByIdAsync(int id)
        {
            var spec = new ProductWithTypeAndBrandSpecification(id);
            var product = await _unitOfWork.GetRepository<Product, int>().GetByIdAsync(spec);

            if (product is null)
                return Error.NotFound(
                    $"Product.NotFound",
                    $"Product with this Id:{id} is not found"
                );

            return _mapper.Map<ProductDTO>(product);
        }

        public async Task<IEnumerable<ProductDTO>> GetRecommendedProductsAsync(
            int productId,
            int count = 5
        )
        {
            var product = await _unitOfWork.GetRepository<Product, int>().GetByIdAsync(productId);
            if (product is null)
            {
                return Enumerable.Empty<ProductDTO>();
            }

            var spec = new RecommendedProductsSpecification(product, count);
            var recommendedProducts = await _unitOfWork.GetRepository<Product, int>().GetAllAsync(spec);
            return _mapper.Map<IEnumerable<ProductDTO>>(recommendedProducts);
        }

        public async Task<IEnumerable<ReviewDTO>> GetReviewsByProductIdAsync(int productId)
        {
            var spec = new ReviewsByProductSpecification(productId);
            var reviews = await _unitOfWork.GetRepository<Review, int>().GetAllAsync(spec);
            return _mapper.Map<IEnumerable<ReviewDTO>>(reviews);
        }

        public async Task<Result<ReviewDTO>> AddReviewAsync(
            int productId,
            string userName,
            CreateReviewDTO createReviewDto
        )
        {
            var product = await _unitOfWork.GetRepository<Product, int>().GetByIdAsync(productId);
            if (product is null)
            {
                return Error.NotFound(
                    $"Product.NotFound",
                    $"Product with this Id:{productId} is not found"
                );
            }

            var review = _mapper.Map<Review>(createReviewDto);
            review.ProductId = productId;
            review.UserName = string.IsNullOrWhiteSpace(userName)
                ? createReviewDto.UserName ?? "Guest"
                : userName;
            review.CreatedAt = DateTime.UtcNow;

            await _unitOfWork.GetRepository<Review, int>().AddAsync(review);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<ReviewDTO>(review);
        }

        public async Task<Result<ProductDTO>> CreateProductAsync(CreateProductDTO dto)
        {
            var brand = await _unitOfWork.GetRepository<ProductBrand, int>().GetByIdAsync(dto.ProductBrandId);
            if (brand is null)
                return Error.NotFound("Brand.NotFound", $"Brand with Id:{dto.ProductBrandId} was not found.");

            var type = await _unitOfWork.GetRepository<ProductType, int>().GetByIdAsync(dto.ProductTypeId);
            if (type is null)
                return Error.NotFound("Type.NotFound", $"Type with Id:{dto.ProductTypeId} was not found.");

            var product = new Product
            {
                Name = dto.Name.Trim(),
                Description = dto.Description.Trim(),
                PictureUrl = dto.PictureUrl.Trim(),
                Price = dto.Price,
                ProductBrandId = dto.ProductBrandId,
                ProductTypeId = dto.ProductTypeId,
                StockQuantity = dto.StockQuantity,
            };

            await _unitOfWork.GetRepository<Product, int>().AddAsync(product);
            await _unitOfWork.SaveChangesAsync();
            await _cacheService.InvalidateProductListCacheAsync();

            return await GetProductByIdAsync(product.Id);
        }

        public async Task<Result<ProductDTO>> UpdateProductAsync(int id, UpdateProductDTO dto)
        {
            var product = await _unitOfWork.GetRepository<Product, int>().GetByIdAsync(id);
            if (product is null)
                return Error.NotFound("Product.NotFound", $"Product with Id:{id} was not found.");

            var brand = await _unitOfWork.GetRepository<ProductBrand, int>().GetByIdAsync(dto.ProductBrandId);
            if (brand is null)
                return Error.NotFound("Brand.NotFound", $"Brand with Id:{dto.ProductBrandId} was not found.");

            var type = await _unitOfWork.GetRepository<ProductType, int>().GetByIdAsync(dto.ProductTypeId);
            if (type is null)
                return Error.NotFound("Type.NotFound", $"Type with Id:{dto.ProductTypeId} was not found.");

            product.Name = dto.Name.Trim();
            product.Description = dto.Description.Trim();
            product.PictureUrl = dto.PictureUrl.Trim();
            product.Price = dto.Price;
            product.ProductBrandId = dto.ProductBrandId;
            product.ProductTypeId = dto.ProductTypeId;
            product.StockQuantity = dto.StockQuantity;

            _unitOfWork.GetRepository<Product, int>().Update(product);
            await _unitOfWork.SaveChangesAsync();
            await _cacheService.InvalidateProductListCacheAsync();

            return await GetProductByIdAsync(id);
        }

        public async Task<Result> DeleteProductAsync(int id)
        {
            var product = await _unitOfWork.GetRepository<Product, int>().GetByIdAsync(id);
            if (product is null)
                return Result.Fail(Error.NotFound("Product.NotFound", $"Product with Id:{id} was not found."));

            _unitOfWork.GetRepository<Product, int>().Delete(product);
            await _unitOfWork.SaveChangesAsync();
            await _cacheService.InvalidateProductListCacheAsync();

            return Result.Ok();
        }
    }
}

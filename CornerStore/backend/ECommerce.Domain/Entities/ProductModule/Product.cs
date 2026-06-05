using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ECommerce.Domain.Entities.ProductModule
{
    public class Product:BaseEntity<int>
    {
        public string Name { get; set; } = default!;

        public string Description { get; set; }=default!;

        public string PictureUrl { get; set; } = default!;

        public decimal Price { get; set; }

        public int StockQuantity { get; set; } = 100;


        #region Relationships

        public int ProductBrandId { get; set; }
        public ProductBrand ProductBrand { get; set; } = null!;

        public int ProductTypeId { get; set; }
        public ProductType ProductType { get; set; } = null!;

        public ICollection<Review> Reviews { get; set; } = new List<Review>();
        #endregion
    }
}

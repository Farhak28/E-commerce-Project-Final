using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ECommerce.Domain.Entities.OrderModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerce.Persistence.Data.Configurations
{
    internal class OrderConfigurations : IEntityTypeConfiguration<Order>
    {
        public void Configure(EntityTypeBuilder<Order> builder)
        {
            builder.Property(X => X.SubTotal).HasColumnType("decimal(8,2)");
            builder.Property(x => x.DeliveryPrice).HasColumnType("decimal(8,2)");
            builder.Property(x => x.DiscountAmount).HasColumnType("decimal(8,2)");
            builder.Property(x => x.CouponCode).HasMaxLength(32);

            builder.OwnsOne(
                X => X.Address,
                OE =>
                {
                    OE.Property(X => X.FirstName).HasMaxLength(50);
                    OE.Property(X => X.LastName).HasMaxLength(50);
                    OE.Property(X => X.City).HasMaxLength(50);
                    OE.Property(X => X.Street).HasMaxLength(50);
                    OE.Property(X => X.Country).HasMaxLength(50);
                }
            );

            builder.Property(x => x.TrackingNumber).HasMaxLength(32);
            builder.Property(x => x.CarrierName).HasMaxLength(100).HasDefaultValue("Corner Store Logistics");
        }
    }
}

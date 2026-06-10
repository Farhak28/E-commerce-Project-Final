using ECommerce.Domain.Entities.OrderModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerce.Persistence.Data.Configurations;

internal class UserCouponConfiguration : IEntityTypeConfiguration<UserCoupon>
{
    public void Configure(EntityTypeBuilder<UserCoupon> builder)
    {
        builder.ToTable("UserCoupons");
        builder.Property(x => x.UserEmail).HasMaxLength(256).IsRequired();
        builder.Property(x => x.RewardKey).HasMaxLength(64).IsRequired();
        builder.Property(x => x.Code).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Title).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500).IsRequired();
        builder.Property(x => x.DiscountValue).HasColumnType("decimal(8,2)");
        builder.Property(x => x.MaxDiscount).HasColumnType("decimal(8,2)");
        builder.Property(x => x.MinOrderAmount).HasColumnType("decimal(8,2)");

        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => new { x.UserEmail, x.RewardKey }).IsUnique();
        builder.HasIndex(x => x.UserEmail);
    }
}

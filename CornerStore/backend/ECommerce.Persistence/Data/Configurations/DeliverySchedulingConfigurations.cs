using ECommerce.Domain.Entities.OrderModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerce.Persistence.Data.Configurations;

internal class DeliveryPricingRuleConfiguration : IEntityTypeConfiguration<DeliveryPricingRule>
{
    public void Configure(EntityTypeBuilder<DeliveryPricingRule> builder)
    {
        builder.Property(x => x.Label).HasMaxLength(120);
        builder.Property(x => x.Amount).HasColumnType("decimal(8,2)");
        builder.Property(x => x.PercentOfBaseCap).HasColumnType("decimal(5,4)");
    }
}

internal class DeliveryTimeSlotConfiguration : IEntityTypeConfiguration<DeliveryTimeSlot>
{
    public void Configure(EntityTypeBuilder<DeliveryTimeSlot> builder)
    {
        builder.Property(x => x.Label).HasMaxLength(80);
    }
}

internal class BlockedDeliveryDateConfiguration : IEntityTypeConfiguration<BlockedDeliveryDate>
{
    public void Configure(EntityTypeBuilder<BlockedDeliveryDate> builder)
    {
        builder.HasIndex(x => x.Date).IsUnique();
        builder.Property(x => x.Reason).HasMaxLength(200);
    }
}

internal class DeliveryHolidayConfiguration : IEntityTypeConfiguration<DeliveryHoliday>
{
    public void Configure(EntityTypeBuilder<DeliveryHoliday> builder)
    {
        builder.HasIndex(x => x.Date).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(120);
    }
}

internal class DeliverySchedulingSettingsConfiguration : IEntityTypeConfiguration<DeliverySchedulingSettings>
{
    public void Configure(EntityTypeBuilder<DeliverySchedulingSettings> builder)
    {
        builder.ToTable("DeliverySchedulingSettings");
    }
}

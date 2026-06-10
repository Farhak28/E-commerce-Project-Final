using ECommerce.Domain.Entities.OrderModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerce.Persistence.Data.Configurations;

internal class OrderTrackingEventConfiguration : IEntityTypeConfiguration<OrderTrackingEvent>
{
    public void Configure(EntityTypeBuilder<OrderTrackingEvent> builder)
    {
        builder.ToTable("OrderTrackingEvents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500).IsRequired();
        builder.Property(x => x.Location).HasMaxLength(200);
        builder.HasIndex(x => x.OrderId);
        builder.HasIndex(x => x.OccurredAt);

        builder
            .HasOne(x => x.Order)
            .WithMany(x => x.TrackingEvents)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

using ECommerce.Domain.Entities.AdminModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerce.Persistence.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.Property(x => x.ActorEmail).HasMaxLength(256);
        builder.Property(x => x.Action).HasMaxLength(64);
        builder.Property(x => x.EntityType).HasMaxLength(64);
        builder.Property(x => x.EntityId).HasMaxLength(128);
        builder.Property(x => x.Details).HasMaxLength(2000);
        builder.HasIndex(x => x.CreatedAt);
        builder.HasIndex(x => x.EntityType);
    }
}

public class RecommendationEventConfiguration : IEntityTypeConfiguration<RecommendationEvent>
{
    public void Configure(EntityTypeBuilder<RecommendationEvent> builder)
    {
        builder.ToTable("RecommendationEvents");
        builder.Property(x => x.Source).HasMaxLength(64);
        builder.Property(x => x.EventType).HasMaxLength(32);
        builder.Property(x => x.ProductIdsJson).HasMaxLength(2000);
        builder.Property(x => x.UserEmail).HasMaxLength(256);
        builder.HasIndex(x => x.CreatedAt);
    }
}

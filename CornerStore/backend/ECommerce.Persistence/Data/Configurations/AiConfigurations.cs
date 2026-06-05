using ECommerce.Domain.Entities.AIModule;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ECommerce.Persistence.Data.Configurations;

internal class KnowledgeDocumentConfiguration : IEntityTypeConfiguration<KnowledgeDocument>
{
    public void Configure(EntityTypeBuilder<KnowledgeDocument> builder)
    {
        builder.ToTable("KnowledgeDocuments");
        builder.Property(x => x.Title).HasMaxLength(256).IsRequired();
        builder.Property(x => x.Category).HasMaxLength(128).IsRequired();
        builder.Property(x => x.Content).IsRequired();
        builder.HasMany(x => x.Chunks).WithOne(x => x.Document).HasForeignKey(x => x.DocumentId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal class KnowledgeChunkConfiguration : IEntityTypeConfiguration<KnowledgeChunk>
{
    public void Configure(EntityTypeBuilder<KnowledgeChunk> builder)
    {
        builder.ToTable("KnowledgeChunks");
        builder.Property(x => x.Text).IsRequired();
        builder.Property(x => x.EmbeddingJson).IsRequired();
        builder.HasIndex(x => x.DocumentId);
    }
}

internal class ChatSessionConfiguration : IEntityTypeConfiguration<ChatSession>
{
    public void Configure(EntityTypeBuilder<ChatSession> builder)
    {
        builder.ToTable("ChatSessions");
        builder.HasKey(x => x.Id);
        builder.HasMany(x => x.Messages).WithOne(x => x.Session).HasForeignKey(x => x.SessionId).OnDelete(DeleteBehavior.Cascade);
    }
}

internal class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("ChatMessages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();
        builder.Property(x => x.Role).HasMaxLength(32).IsRequired();
        builder.Property(x => x.Content).IsRequired();
        builder.HasIndex(x => x.SessionId);
    }
}

internal class AssistantInteractionLogConfiguration : IEntityTypeConfiguration<AssistantInteractionLog>
{
    public void Configure(EntityTypeBuilder<AssistantInteractionLog> builder)
    {
        builder.ToTable("AssistantInteractionLogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();
    }
}

internal class VisualSearchEventConfiguration : IEntityTypeConfiguration<VisualSearchEvent>
{
    public void Configure(EntityTypeBuilder<VisualSearchEvent> builder)
    {
        builder.ToTable("VisualSearchEvents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id).ValueGeneratedOnAdd();
        builder.Property(x => x.DetectedCategory).HasMaxLength(128).IsRequired();
        builder.Property(x => x.DetectedBrand).HasMaxLength(128);
        builder.Property(x => x.AttributesJson).IsRequired();
        builder.HasIndex(x => x.CreatedAt);
    }
}

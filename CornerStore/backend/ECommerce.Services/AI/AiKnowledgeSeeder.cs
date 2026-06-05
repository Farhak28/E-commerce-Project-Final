using ECommerce.Domain.Entities.AIModule;
using ECommerce.Persistence.Data.DbContexts;
using ECommerce.Services.Abstraction.AI;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services.AI;

public static class AiKnowledgeSeeder
{
    public static async Task SeedAsync(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<StoreDbContext>();
        var rag = scope.ServiceProvider.GetRequiredService<IRagService>();
        var options = scope.ServiceProvider.GetRequiredService<IOptions<AiOptions>>().Value;
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("AiKnowledgeSeeder");

        if (!await db.KnowledgeDocuments.AnyAsync())
        {
            var docs = DefaultDocuments();
            foreach (var doc in docs)
                db.KnowledgeDocuments.Add(doc);
            await db.SaveChangesAsync();
            logger.LogInformation("Seeded {Count} AI knowledge documents", docs.Count);
        }

        // Always ensure text chunks exist (no Gemini API calls).
        await rag.EnsureTextChunksAsync();

        // Optional: vector embeddings on startup — disabled by default to preserve free-tier quota.
        if (options.EnableStartupIndexing && options.GeminiApiKey is { Length: > 0 })
        {
            await rag.ReindexAllAsync();
            logger.LogInformation("AI knowledge vector index rebuilt on startup");
        }
    }

    private static List<KnowledgeDocument> DefaultDocuments() =>
    [
        new()
        {
            Title = "Shipping Policy",
            Category = "Shipping",
            Content =
                "Corner Store ships within 3-5 business days domestically. Express delivery is available at checkout. Track orders under Account → Order History. International shipping may take 7-14 business days.",
        },
        new()
        {
            Title = "Return Policy",
            Category = "Returns",
            Content =
                "You may return unused items within 14 days of delivery. Open Account → Orders and contact support with your order ID to start a return. Refunds are processed within 5-7 business days after inspection.",
        },
        new()
        {
            Title = "Payment Methods",
            Category = "Payment",
            Content =
                "We accept credit/debit cards and Apple Pay via Stripe, InstaPay bank transfer, and cash on delivery. Card payments are encrypted. InstaPay orders are confirmed after manual verification.",
        },
        new()
        {
            Title = "Warranty",
            Category = "Warranty",
            Content =
                "Electronics include a 1-year manufacturer warranty unless noted on the product page. Keep your order receipt for claims. Extended warranty may be available on select items.",
        },
        new()
        {
            Title = "Support Hours",
            Category = "FAQ",
            Content =
                "Corner Store online support is available 24/7 via the AI assistant and Help page. Live agents: Sun-Thu 9am-6pm local time.",
        },
        new()
        {
            Title = "Shopping Guide",
            Category = "Product Guides",
            Content =
                "Use search or ask the assistant for budget picks, category browsing, and comparisons. Add items to compare (up to 4) then open the Compare page. Sign in for personalized recommendations based on cart, wishlist, and orders.",
        },
        new()
        {
            Title = "Privacy",
            Category = "FAQ",
            Content =
                "We use account data to fulfill orders and personalize recommendations. You can update profile details under Account. We do not sell personal data.",
        },
    ];
}

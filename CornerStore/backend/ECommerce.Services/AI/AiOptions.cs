namespace ECommerce.Services.AI;

public sealed class AiOptions
{
    public const string SectionName = "AI";

    public string GeminiApiKey { get; set; } = "";
    public string ModelName { get; set; } = "gemini-2.5-flash";
    public string EmbeddingModelName { get; set; } = "text-embedding-004";
    public float Temperature { get; set; } = 0.4f;
    public int MaxTokens { get; set; } = 2048;
    public int ChunkSize { get; set; } = 800;
    public int ChunkOverlap { get; set; } = 100;
    public int TopKRetrieval { get; set; } = 5;
    public int HistoryLength { get; set; } = 20;
    public int MaxToolIterations { get; set; } = 3;
    public int MaxRetries { get; set; } = 3;
    /// <summary>When false, startup only stores knowledge text — no embedding API calls (saves free-tier quota).</summary>
    public bool EnableStartupIndexing { get; set; } = false;
}

using ECommerce.Services.AI;

namespace ECommerce.Services.Tests;

public class RagChunkingTests
{
    [Fact]
    public void ChunkText_AppliesOverlapBetweenChunks()
    {
        var content = new string('a', 1500);
        var chunks = RagService.ChunkText(content, chunkSize: 800, overlap: 100);

        Assert.True(chunks.Count >= 2);
        Assert.Equal(800, chunks[0].Length);
        Assert.True(chunks[1].Length > 0);
        Assert.Equal(700, 800 - 100);
    }

    [Fact]
    public void ChunkText_ReturnsEmpty_ForBlankContent()
    {
        var chunks = RagService.ChunkText("   ", 800, 100);
        Assert.Empty(chunks);
    }
}

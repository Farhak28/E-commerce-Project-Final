using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared.DTOs.AdminDTOs;
using ECommerce.Shared.DTOs.AIDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers;

[Authorize(Roles = "Admin,SuperAdmin")]
public class KnowledgeController : ApiBaseController
{
    private readonly IKnowledgeService _knowledge;
    private readonly IRagService _rag;
    private readonly IAuditLogService _auditLog;

    public KnowledgeController(IKnowledgeService knowledge, IRagService rag, IAuditLogService auditLog)
    {
        _knowledge = knowledge;
        _rag = rag;
        _auditLog = auditLog;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<KnowledgeDocumentDTO>>> GetAll(
        [FromQuery] string? category,
        CancellationToken ct
    )
    {
        return Ok(await _knowledge.GetAllAsync(category, ct));
    }

    [HttpGet("{id:int}/chunks")]
    public async Task<ActionResult<KnowledgeChunksPageDTO>> GetChunks(
        int id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default
    )
    {
        return Ok(await _knowledge.GetChunksAsync(id, page, pageSize, ct));
    }

    [HttpGet("chunks")]
    public async Task<ActionResult<KnowledgeChunksPageDTO>> GetAllChunks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default
    )
    {
        return Ok(await _knowledge.GetChunksAsync(null, page, pageSize, ct));
    }

    [HttpPost]
    public async Task<ActionResult<KnowledgeDocumentDTO>> Create([FromBody] CreateKnowledgeDocumentDTO dto)
    {
        var result = await _knowledge.CreateAsync(dto);
        if (result.IsSuccess)
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
            await _auditLog.WriteAsync(email, "Create", "KnowledgeDocument", result.Value.Id.ToString(), result.Value.Title);
        }
        return HandleResult(result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<KnowledgeDocumentDTO>> Update(int id, [FromBody] UpdateKnowledgeDocumentDTO dto)
    {
        var result = await _knowledge.UpdateAsync(id, dto);
        if (result.IsSuccess)
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
            await _auditLog.WriteAsync(email, "Update", "KnowledgeDocument", id.ToString(), dto.Title);
        }
        return HandleResult(result);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await _knowledge.DeleteAsync(id);
        if (result.IsSuccess)
        {
            var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
            await _auditLog.WriteAsync(email, "Delete", "KnowledgeDocument", id.ToString());
        }
        return HandleResult(result);
    }

    [HttpPost("reindex-all")]
    public async Task<IActionResult> ReindexAll(CancellationToken ct)
    {
        await _rag.ReindexAllAsync(ct);
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
        await _auditLog.WriteAsync(email, "ReindexAll", "KnowledgeDocument", details: "Full knowledge reindex");
        return NoContent();
    }

    [HttpPost("{id:int}/reindex")]
    public async Task<IActionResult> ReindexDocument(int id, CancellationToken ct)
    {
        await _rag.ReindexDocumentAsync(id, ct);
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "admin";
        await _auditLog.WriteAsync(email, "Reindex", "KnowledgeDocument", id.ToString());
        return NoContent();
    }
}

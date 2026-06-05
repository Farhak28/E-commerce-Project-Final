using ECommerce.Services.Abstraction;
using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared.DTOs.AIDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers;

public class AssistantController : ApiBaseController
{
    private readonly IChatAssistantService _assistant;
    private readonly IVisualSearchService _visualSearch;

    public AssistantController(IChatAssistantService assistant, IVisualSearchService visualSearch)
    {
        _assistant = assistant;
        _visualSearch = visualSearch;
    }

    [HttpGet("status")]
    [AllowAnonymous]
    public async Task<ActionResult<AssistantStatusDTO>> GetStatus()
    {
        return Ok(await _assistant.GetStatusAsync());
    }

    [HttpGet("sessions/{sessionId:guid}/messages")]
    [AllowAnonymous]
    public async Task<ActionResult<AssistantSessionHistoryDTO>> GetSessionHistory(Guid sessionId)
    {
        var history = await _assistant.GetSessionHistoryAsync(sessionId);
        if (history is null)
            return NotFound();
        return Ok(history);
    }

    [HttpPost("chat")]
    [AllowAnonymous]
    public async Task<ActionResult<AssistantChatResponseDTO>> Chat([FromBody] AssistantChatRequestDTO request)
    {
        string? email = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            try
            {
                email = GetEmailFromToken();
            }
            catch
            {
                // optional auth
            }
        }

        var response = await _assistant.ChatAsync(request, email);
        return Ok(response);
    }

    [HttpPost("visual-search")]
    [AllowAnonymous]
    [RequestSizeLimit(15 * 1024 * 1024)]
    public async Task<ActionResult<VisualSearchResponseDTO>> VisualSearch([FromBody] VisualSearchRequestDTO request)
    {
        string? email = null;
        if (User.Identity?.IsAuthenticated == true)
        {
            try
            {
                email = GetEmailFromToken();
            }
            catch
            {
                // optional auth
            }
        }

        try
        {
            var response = await _visualSearch.SearchAsync(request, email);
            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

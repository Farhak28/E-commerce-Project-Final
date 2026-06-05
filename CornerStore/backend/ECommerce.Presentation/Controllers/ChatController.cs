using ECommerce.Services.Abstraction.AI;
using ECommerce.Shared.DTOs.AIDTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerce.Presentation.Controllers;

/// <summary>
/// Alias route for the AI shopping assistant chat endpoint (POST /api/chat).
/// </summary>
[Route("api/chat")]
public class ChatController : ApiBaseController
{
    private readonly IChatAssistantService _assistant;

    public ChatController(IChatAssistantService assistant)
    {
        _assistant = assistant;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<ChatApiResponseDTO>> Post([FromBody] ChatApiRequestDTO request)
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

        var assistantRequest = new AssistantChatRequestDTO(request.SessionId, request.Message);
        var response = await _assistant.ChatAsync(assistantRequest, email);
        return Ok(
            new ChatApiResponseDTO(
                response.SessionId,
                response.Text,
                response.Products,
                response.Structured
            )
        );
    }
}

using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using ECommerce.Services.Abstraction.AI;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ECommerce.Services.AI;

public sealed class GeminiProvider : IAIProvider
{
    private readonly HttpClient _http;
    private readonly AiOptions _options;
    private readonly ILogger<GeminiProvider> _logger;

    public GeminiProvider(HttpClient http, IOptions<AiOptions> options, ILogger<GeminiProvider> logger)
    {
        _http = http;
        _options = options.Value;
        _logger = logger;
    }

    public string ProviderName => "gemini";
    public bool IsConfigured => !string.IsNullOrWhiteSpace(_options.GeminiApiKey);

    public async Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default)
    {
        EnsureConfigured();
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{_options.EmbeddingModelName}:embedContent";
        var body = new { content = new { parts = new[] { new { text } } } };
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.TryAddWithoutValidation("x-goog-api-key", _options.GeminiApiKey);
        request.Content = JsonContent.Create(body);
        using var response = await _http.SendAsync(request, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Gemini embedding failed: {Status} {Body}", response.StatusCode, json);
            throw new InvalidOperationException("Embedding generation failed.");
        }
        using var doc = JsonDocument.Parse(json);
        var values = doc.RootElement.GetProperty("embedding").GetProperty("values");
        var result = new float[values.GetArrayLength()];
        var i = 0;
        foreach (var v in values.EnumerateArray())
            result[i++] = (float)v.GetDouble();
        return result;
    }

    public async Task<AiGenerateResponse> GenerateResponseAsync(AiGenerateRequest request, CancellationToken ct = default)
    {
        EnsureConfigured();
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{_options.ModelName}:generateContent";

        var payload = BuildPayload(request);
        using var response = await PostGeminiAsync(url, payload, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Gemini generate failed: {Status} {Body}", response.StatusCode, json);
            throw new InvalidOperationException(ParseGeminiError(json, response.StatusCode));
        }

        return ParseGenerateResponse(json);
    }

    public async Task<AiGenerateResponse> GenerateWithFunctionResponseAsync(
        AiGenerateRequest request,
        string functionName,
        object functionResponse,
        CancellationToken ct = default)
    {
        EnsureConfigured();
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{_options.ModelName}:generateContent";

        var contents = new List<object>();
        foreach (var msg in request.History)
        {
            contents.Add(new
            {
                role = msg.Role == "assistant" ? "model" : "user",
                parts = new[] { new { text = msg.Content } },
            });
        }
        contents.Add(new { role = "user", parts = new[] { new { text = request.UserMessage } } });
        contents.Add(new
        {
            role = "function",
            parts = new[]
            {
                new
                {
                    functionResponse = new
                    {
                        name = functionName,
                        response = functionResponse,
                    },
                },
            },
        });

        var payloadObj = new Dictionary<string, object?>
        {
            ["systemInstruction"] = new { parts = new[] { new { text = request.SystemPrompt } } },
            ["contents"] = contents,
            ["generationConfig"] = new { temperature = _options.Temperature, maxOutputTokens = _options.MaxTokens },
        };
        if (request.Tools?.Count > 0)
            payloadObj["tools"] = new[] { new { functionDeclarations = request.Tools.Select(ToGeminiTool).ToList() } };

        var payload = JsonSerializer.Serialize(payloadObj);
        using var response = await PostGeminiAsync(url, payload, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(ParseGeminiError(json, response.StatusCode));
        return ParseGenerateResponse(json);
    }

    private string BuildPayload(AiGenerateRequest request)
    {
        var contents = request.History
            .Select(m => new
            {
                role = m.Role == "assistant" ? "model" : "user",
                parts = new[] { new { text = m.Content } },
            })
            .Append(new { role = "user", parts = new[] { new { text = request.UserMessage } } })
            .ToList();

        var payload = new Dictionary<string, object?>
        {
            ["systemInstruction"] = new { parts = new[] { new { text = request.SystemPrompt } } },
            ["contents"] = contents,
            ["generationConfig"] = new { temperature = _options.Temperature, maxOutputTokens = _options.MaxTokens },
        };

        if (request.Tools?.Count > 0)
        {
            payload["tools"] = new[]
            {
                new { functionDeclarations = request.Tools.Select(ToGeminiTool).ToList() },
            };
        }

        return JsonSerializer.Serialize(payload);
    }

    private static object ToGeminiTool(AiToolDefinition tool) => new
    {
        name = tool.Name,
        description = tool.Description,
        parameters = JsonSerializer.Deserialize<object>(tool.ParametersJsonSchema),
    };

    private static AiGenerateResponse ParseGenerateResponse(string json)
    {
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        int? promptTokens = null;
        int? responseTokens = null;
        if (root.TryGetProperty("usageMetadata", out var usage))
        {
            if (usage.TryGetProperty("promptTokenCount", out var p)) promptTokens = p.GetInt32();
            if (usage.TryGetProperty("candidatesTokenCount", out var c)) responseTokens = c.GetInt32();
        }

        if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            return new AiGenerateResponse("I could not generate a response.", null, promptTokens, responseTokens);

        var parts = candidates[0].GetProperty("content").GetProperty("parts");
        string? text = null;
        var toolCalls = new List<AiToolCall>();

        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textEl))
                text = (text ?? "") + textEl.GetString();
            if (part.TryGetProperty("functionCall", out var fc))
            {
                var name = fc.GetProperty("name").GetString() ?? "";
                var args = fc.TryGetProperty("args", out var argsEl)
                    ? argsEl.GetRawText()
                    : "{}";
                toolCalls.Add(new AiToolCall(name, args));
            }
        }

        return new AiGenerateResponse(text, toolCalls.Count > 0 ? toolCalls : null, promptTokens, responseTokens);
    }

    private void EnsureConfigured()
    {
        if (!IsConfigured)
            throw new InvalidOperationException("GEMINI_API_KEY is not configured.");
    }

    public async Task<string> AnalyzeImageAsync(
        string imageBase64,
        string mimeType,
        string prompt,
        CancellationToken ct = default
    )
    {
        EnsureConfigured();
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{_options.ModelName}:generateContent";

        var payload = new Dictionary<string, object?>
        {
            ["contents"] = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = prompt },
                        new { inline_data = new { mime_type = mimeType, data = imageBase64 } },
                    },
                },
            },
            ["generationConfig"] = new
            {
                temperature = 0.2,
                maxOutputTokens = _options.MaxTokens,
                responseMimeType = "application/json",
            },
        };

        var jsonBody = JsonSerializer.Serialize(payload);
        using var response = await PostGeminiAsync(url, jsonBody, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Gemini vision failed: {Status} {Body}", response.StatusCode, json);
            throw new InvalidOperationException(ParseGeminiError(json, response.StatusCode));
        }

        using var doc = JsonDocument.Parse(json);
        if (!doc.RootElement.TryGetProperty("candidates", out var candidates)
            || candidates.GetArrayLength() == 0)
        {
            return "{}";
        }

        var parts = candidates[0].GetProperty("content").GetProperty("parts");
        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var textEl))
                return textEl.GetString() ?? "{}";
        }

        return "{}";
    }

    public async Task<AiGenerateResponse> GenerateWithContentsAsync(
        string systemPrompt,
        IReadOnlyList<GeminiContentPart> contents,
        IReadOnlyList<AiToolDefinition>? tools,
        CancellationToken ct = default
    )
    {
        EnsureConfigured();
        var url =
            $"https://generativelanguage.googleapis.com/v1beta/models/{_options.ModelName}:generateContent";

        var contentPayload = contents.Select(ToContentObject).ToList();
        var payload = new Dictionary<string, object?>
        {
            ["systemInstruction"] = new { parts = new[] { new { text = systemPrompt } } },
            ["contents"] = contentPayload,
            ["generationConfig"] = new { temperature = _options.Temperature, maxOutputTokens = _options.MaxTokens },
        };

        if (tools?.Count > 0)
            payload["tools"] = new[] { new { functionDeclarations = tools.Select(ToGeminiTool).ToList() } };

        var jsonBody = JsonSerializer.Serialize(payload);
        using var response = await PostGeminiAsync(url, jsonBody, ct);
        var json = await response.Content.ReadAsStringAsync(ct);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Gemini generate failed: {Status} {Body}", response.StatusCode, json);
            throw new InvalidOperationException(ParseGeminiError(json, response.StatusCode));
        }

        return ParseGenerateResponse(json);
    }

    private async Task<HttpResponseMessage> PostGeminiAsync(string url, string jsonBody, CancellationToken ct)
    {
        var attempts = Math.Max(1, _options.MaxRetries);
        Exception? lastError = null;

        for (var attempt = 1; attempt <= attempts; attempt++)
        {
            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, url);
                request.Headers.TryAddWithoutValidation("x-goog-api-key", _options.GeminiApiKey);
                request.Content = new StringContent(jsonBody, Encoding.UTF8, "application/json");
                var response = await _http.SendAsync(request, ct);

                if (response.IsSuccessStatusCode
                    || response.StatusCode != System.Net.HttpStatusCode.TooManyRequests
                    || attempt == attempts)
                {
                    return response;
                }

                _logger.LogWarning("Gemini rate limited, retry {Attempt}/{Max}", attempt, attempts);
                await Task.Delay(TimeSpan.FromMilliseconds(500 * attempt), ct);
            }
            catch (Exception ex) when (attempt < attempts)
            {
                lastError = ex;
                _logger.LogWarning(ex, "Gemini request failed, retry {Attempt}/{Max}", attempt, attempts);
                await Task.Delay(TimeSpan.FromMilliseconds(300 * attempt), ct);
            }
        }

        throw lastError ?? new InvalidOperationException("Gemini request failed after retries.");
    }

    private static string ParseGeminiError(string json, System.Net.HttpStatusCode statusCode)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("error", out var err)
                && err.TryGetProperty("message", out var msgEl))
            {
                var msg = msgEl.GetString() ?? statusCode.ToString();
                if (msg.Contains("not found", StringComparison.OrdinalIgnoreCase)
                    || msg.Contains("NOT_FOUND", StringComparison.OrdinalIgnoreCase))
                {
                    return $"Gemini model not found. Set AI__ModelName=gemini-2.5-flash in .env and rebuild. ({msg})";
                }
                if (statusCode == System.Net.HttpStatusCode.TooManyRequests
                    || msg.Contains("quota", StringComparison.OrdinalIgnoreCase)
                    || msg.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase))
                {
                    return $"Gemini rate limit reached: {msg}";
                }
                return $"Gemini API error: {msg}";
            }
        }
        catch
        {
            /* use fallback */
        }

        return $"Gemini API error: {statusCode}";
    }

    private static object ToContentObject(GeminiContentPart part)
    {
        if (part.Role == "function" && part.FunctionName is not null)
        {
            return new
            {
                role = "function",
                parts = new[]
                {
                    new
                    {
                        functionResponse = new { name = part.FunctionName, response = part.FunctionResponse ?? new { } },
                    },
                },
            };
        }

        if (part.ToolCalls is { Count: > 0 })
        {
            var partsList = new List<object>();
            if (!string.IsNullOrWhiteSpace(part.Text))
                partsList.Add(new { text = part.Text });
            foreach (var tc in part.ToolCalls)
            {
                partsList.Add(new
                {
                    functionCall = new
                    {
                        name = tc.Name,
                        args = JsonSerializer.Deserialize<object>(tc.ArgumentsJson),
                    },
                });
            }
            return new { role = "model", parts = partsList };
        }

        return new
        {
            role = part.Role == "model" ? "model" : "user",
            parts = new[] { new { text = part.Text } },
        };
    }
}

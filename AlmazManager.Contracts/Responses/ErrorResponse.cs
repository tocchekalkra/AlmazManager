namespace AlmazManager.Contracts.Responses;

public sealed record ErrorResponse(
    int StatusCode,
    string Message,
    DateTime TimestampUtc,
    Dictionary<string, string[]>? Errors = null);

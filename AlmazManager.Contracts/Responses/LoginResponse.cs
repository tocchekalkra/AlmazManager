namespace AlmazManager.Contracts.Responses;

public sealed record LoginResponse(
    string AccessToken,
    string TokenType,
    DateTime ExpiresAtUtc,
    Guid UserId,
    string FullName,
    string Login,
    string Role);

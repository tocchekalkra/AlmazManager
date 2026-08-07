namespace AlmazManager.Contracts.Responses;

public sealed record UserResponse(
    Guid Id,
    string FullName,
    string Login,
    string Role,
    bool IsActive,
    DateTime CreatedAtUtc);

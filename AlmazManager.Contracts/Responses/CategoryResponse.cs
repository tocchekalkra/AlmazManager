namespace AlmazManager.Contracts.Responses;

public sealed record CategoryResponse(
    Guid Id,
    string Name,
    bool IsActive);

namespace AlmazManager.Contracts.Responses.Preferences;

public sealed record UserPreferencesResponse(
    string Theme,
    IReadOnlyList<Guid> MaterialOrder,
    IReadOnlyList<Guid> CategoryOrder);

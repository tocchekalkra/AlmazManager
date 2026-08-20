namespace AlmazManager.Contracts.Requests.Preferences;

public sealed record UpdatePreferencesRequest(
    string? Theme,
    IReadOnlyList<Guid>? MaterialOrder,
    IReadOnlyList<Guid>? CategoryOrder,
    bool ResetOrder = false);

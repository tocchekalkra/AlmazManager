namespace AlmazManager.Contracts.Requests.Materials;

public sealed record CreateMaterialRequest(
    string Name,
    string Article,
    Guid CategoryId,
    string Unit,
    decimal MinimumQuantity);

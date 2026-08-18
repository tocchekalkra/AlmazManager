namespace AlmazManager.Contracts.Responses.Materials;

public sealed record MaterialArchiveImpactResponse(
    Guid MaterialId,
    string MaterialName,
    bool HasHistory,
    int OpenSupplyLinks,
    bool CanPermanentlyDelete);

namespace AlmazManager.Contracts.Responses.InventoryDocuments;

public sealed record InventoryDocumentItemResponse(
    Guid Id,
    Guid MaterialId,
    string MaterialName,
    string? Article,
    string Unit,
    decimal ExpectedQuantity,
    decimal ActualQuantity,
    decimal Difference);

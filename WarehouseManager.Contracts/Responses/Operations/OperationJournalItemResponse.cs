namespace WarehouseManager.Contracts.Responses.Operations;

public sealed record OperationJournalItemResponse(
    Guid Id,
    Guid MaterialId,
    string MaterialName,
    string MaterialArticle,
    string Type,
    string DisplayType,
    decimal Quantity,
    decimal QuantityBefore,
    decimal QuantityChange,
    decimal QuantityAfter,
    Guid UserId,
    string UserName,
    Guid? DocumentId,
    string? DocumentNumber,
    bool IsReversal,
    Guid? ReversedOperationId,
    DateTime CreatedAtUtc,
    string? Comment);
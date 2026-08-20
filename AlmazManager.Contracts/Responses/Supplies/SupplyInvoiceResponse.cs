namespace AlmazManager.Contracts.Responses.Supplies;

public sealed record SupplyInvoiceResponse(
    Guid Id,
    Guid CreatedByUserId,
    string Supplier,
    string InvoiceNumber,
    DateOnly InvoiceDate,
    decimal Amount,
    DateOnly? PaymentDueDate,
    DateOnly? ExpectedDeliveryDate,
    string? AttachmentUrl,
    string? Comment,
    string Status,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    IReadOnlyList<SupplyInvoiceItemResponse> Items);

public sealed record SupplyInvoiceItemResponse(
    Guid Id,
    Guid MaterialId,
    decimal ExpectedQuantity,
    decimal ReceivedQuantity,
    decimal RemainingQuantity);

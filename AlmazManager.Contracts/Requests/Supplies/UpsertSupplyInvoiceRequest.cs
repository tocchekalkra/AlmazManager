namespace AlmazManager.Contracts.Requests.Supplies;

public sealed record UpsertSupplyInvoiceRequest(
    string Supplier,
    string InvoiceNumber,
    DateOnly InvoiceDate,
    decimal Amount,
    DateOnly? PaymentDueDate,
    DateOnly? ExpectedDeliveryDate,
    string? Comment,
    IReadOnlyList<UpsertSupplyInvoiceItemRequest> Items);

public sealed record UpsertSupplyInvoiceItemRequest(
    Guid MaterialId,
    decimal ExpectedQuantity);

public sealed record UpdateSupplyInvoiceStatusRequest(string Status);

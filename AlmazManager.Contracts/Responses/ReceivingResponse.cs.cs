namespace AlmazManager.Contracts.Responses;

public sealed record ReceivingResponse(
    Guid OperationId,
    Guid MaterialId,
    decimal ReceivedQuantity,
    decimal CurrentQuantity,
    DateTime CreatedAtUtc);

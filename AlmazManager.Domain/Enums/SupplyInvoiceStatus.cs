namespace AlmazManager.Domain.Enums;

public enum SupplyInvoiceStatus
{
    AwaitingPayment = 1,
    Paid = 2,
    AwaitingDelivery = 3,
    PartiallyReceived = 4,
    FullyReceived = 5,
    Cancelled = 6
}

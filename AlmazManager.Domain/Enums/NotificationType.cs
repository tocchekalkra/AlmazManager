namespace AlmazManager.Domain.Enums;

public enum NotificationType
{
    LowStock = 1,
    PaymentDueSoon = 2,
    PaymentDueToday = 3,
    PaymentOverdue = 4,
    DeliveryDueToday = 5,
    DeliveryDelayed = 6,
    PartialDelivery = 7
}

using AlmazManager.Application.Interfaces;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Services;

public sealed class StockNotificationService : IStockNotificationService
{
    private readonly INotificationRepository _notifications;
    private readonly IUserRepository _users;
    private readonly IUserCategoryAccessRepository _accesses;
    private readonly ISupplyInvoiceRepository _supplies;

    public StockNotificationService(
        INotificationRepository notifications,
        IUserRepository users,
        IUserCategoryAccessRepository accesses,
        ISupplyInvoiceRepository supplies)
    {
        _notifications = notifications;
        _users = users;
        _accesses = accesses;
        _supplies = supplies;
    }

    public async Task HandleStockChangeAsync(
        Material material,
        decimal quantityBefore,
        decimal quantityAfter)
    {
        if (quantityAfter >= material.MinimumQuantity)
        {
            var active = await _notifications.GetActiveByMaterialIdAsync(material.Id);

            foreach (var notification in active.Where(x => x.Type == NotificationType.LowStock))
                notification.Resolve();

            if (active.Count > 0)
                await _notifications.SaveChangesAsync();

            return;
        }

        var recipients = await GetCategoryRecipientsAsync(material.CategoryId);
        var key = $"low-stock:{material.Id}";
        var created = new List<Notification>();

        foreach (var userId in recipients)
        {
            if (await _notifications.GetActiveByKeyAsync(userId, key) is not null)
                continue;

            created.Add(new Notification(
                userId,
                NotificationType.LowStock,
                "Материал требует внимания",
                $"{MaterialDisplayName.Format(material)} ({material.Article}): остаток {quantityAfter:0.###}, минимум {material.MinimumQuantity:0.###}.",
                material.Id,
                deduplicationKey: key));
        }

        if (created.Count == 0)
            return;

        await _notifications.AddRangeAsync(created);
        await _notifications.SaveChangesAsync();
    }

    public async Task RefreshSupplyRemindersAsync()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var recipients = (await _users.GetAllAsync())
            .Where(x => x.IsActive && (x.Role == UserRole.Administrator || x.CanManageSupplies))
            .Select(x => x.Id)
            .ToList();

        if (recipients.Count == 0)
            return;

        var supplies = await _supplies.GetOpenAsync();

        foreach (var invoice in supplies)
        {
            if (invoice.Status == SupplyInvoiceStatus.AwaitingPayment && invoice.PaymentDueDate.HasValue)
            {
                var days = invoice.PaymentDueDate.Value.DayNumber - today.DayNumber;

                if (days <= 3)
                {
                    var type = days < 0
                        ? NotificationType.PaymentOverdue
                        : days == 0
                            ? NotificationType.PaymentDueToday
                            : NotificationType.PaymentDueSoon;

                    await EnsureSupplyNotificationAsync(
                        recipients,
                        invoice,
                        type,
                        $"Счёт {invoice.InvoiceNumber}: {PaymentMessage(days)}",
                        $"payment:{invoice.Id}:{invoice.PaymentDueDate:yyyyMMdd}:{type}");
                }
            }

            if (invoice.ExpectedDeliveryDate.HasValue &&
                invoice.Status is not SupplyInvoiceStatus.FullyReceived and not SupplyInvoiceStatus.Cancelled)
            {
                var days = invoice.ExpectedDeliveryDate.Value.DayNumber - today.DayNumber;

                if (days <= 0)
                {
                    var type = days < 0
                        ? NotificationType.DeliveryDelayed
                        : NotificationType.DeliveryDueToday;

                    await EnsureSupplyNotificationAsync(
                        recipients,
                        invoice,
                        type,
                        days < 0
                            ? $"Поставка по счёту {invoice.InvoiceNumber} задерживается."
                            : $"Поставка по счёту {invoice.InvoiceNumber} ожидается сегодня.",
                        $"delivery:{invoice.Id}:{invoice.ExpectedDeliveryDate:yyyyMMdd}:{type}");
                }
            }

            if (invoice.Status == SupplyInvoiceStatus.PartiallyReceived)
            {
                await EnsureSupplyNotificationAsync(
                    recipients,
                    invoice,
                    NotificationType.PartialDelivery,
                    $"Поставка по счёту {invoice.InvoiceNumber} получена частично.",
                    $"partial:{invoice.Id}:{invoice.UpdatedAtUtc:yyyyMMddHHmm}");
            }
        }

        await _notifications.SaveChangesAsync();
    }

    private async Task<HashSet<Guid>> GetCategoryRecipientsAsync(Guid categoryId)
    {
        var users = await _users.GetAllAsync();
        var accesses = await _accesses.GetByCategoryIdAsync(categoryId);

        return users
            .Where(user =>
                user.IsActive &&
                (user.Role == UserRole.Administrator ||
                 accesses.Any(access =>
                     access.UserId == user.Id &&
                     access.IsActive &&
                     access.CanView)))
            .Select(user => user.Id)
            .ToHashSet();
    }

    private async Task EnsureSupplyNotificationAsync(
        IEnumerable<Guid> recipients,
        SupplyInvoice invoice,
        NotificationType type,
        string message,
        string key)
    {
        foreach (var userId in recipients)
        {
            if (await _notifications.GetActiveByKeyAsync(userId, key) is not null)
                continue;

            await _notifications.AddAsync(new Notification(
                userId,
                type,
                "Счета и поставки",
                message,
                supplyInvoiceId: invoice.Id,
                deduplicationKey: key));
        }
    }

    private static string PaymentMessage(int days) => days switch
    {
        < 0 => "оплата просрочена.",
        0 => "необходимо оплатить сегодня.",
        1 => "срок оплаты наступит завтра.",
        _ => $"до срока оплаты осталось {days} дн."
    };
}

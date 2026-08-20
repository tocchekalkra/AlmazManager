using AlmazManager.Domain.Entities;

namespace AlmazManager.Application.Interfaces;

public interface IStockNotificationService
{
    Task HandleStockChangeAsync(Material material, decimal quantityBefore, decimal quantityAfter);
    Task RefreshSupplyRemindersAsync();
}

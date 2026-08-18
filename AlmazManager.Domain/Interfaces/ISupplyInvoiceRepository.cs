using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface ISupplyInvoiceRepository
{
    Task<SupplyInvoice?> GetByIdAsync(Guid id);
    Task<List<SupplyInvoice>> GetAllAsync();
    Task<List<SupplyInvoice>> GetOpenAsync();
    Task AddAsync(SupplyInvoice invoice);
    Task SaveChangesAsync();
}

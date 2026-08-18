using AlmazManager.Domain.Entities;

namespace AlmazManager.Domain.Interfaces;

public interface IAuditEventRepository
{
    Task<List<AuditEvent>> GetAllAsync();
    Task AddAsync(AuditEvent auditEvent);
    Task SaveChangesAsync();
}

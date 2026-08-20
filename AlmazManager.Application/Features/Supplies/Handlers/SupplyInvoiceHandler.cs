using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Requests.Supplies;
using AlmazManager.Contracts.Responses.Supplies;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Supplies.Handlers;

public sealed class SupplyInvoiceHandler
{
    private readonly ISupplyInvoiceRepository _repository;
    private readonly IMaterialRepository _materials;
    private readonly ISystemAccessService _systemAccess;
    private readonly ICategoryAccessService _categoryAccess;
    private readonly ICurrentUserService _currentUser;
    private readonly IAuditEventRepository _audit;

    public SupplyInvoiceHandler(
        ISupplyInvoiceRepository repository,
        IMaterialRepository materials,
        ISystemAccessService systemAccess,
        ICategoryAccessService categoryAccess,
        ICurrentUserService currentUser,
        IAuditEventRepository audit)
    {
        _repository = repository;
        _materials = materials;
        _systemAccess = systemAccess;
        _categoryAccess = categoryAccess;
        _currentUser = currentUser;
        _audit = audit;
    }

    public async Task<IReadOnlyList<SupplyInvoiceResponse>> GetAllAsync()
    {
        await _systemAccess.EnsureAccessAsync(SystemPermission.ManageSupplies);
        var invoices = await _repository.GetAllAsync();
        var visibleMaterialIds = await GetVisibleMaterialIdsAsync();

        return invoices
            .Select(invoice => Map(invoice, visibleMaterialIds))
            .Where(invoice => visibleMaterialIds is null || invoice.Items.Count > 0)
            .ToList();
    }

    public async Task<SupplyInvoiceResponse?> GetByIdAsync(Guid id)
    {
        await _systemAccess.EnsureAccessAsync(SystemPermission.ManageSupplies);
        var invoice = await _repository.GetByIdAsync(id);
        if (invoice is null)
            return null;

        var visibleMaterialIds = await GetVisibleMaterialIdsAsync();
        var response = Map(invoice, visibleMaterialIds);
        return visibleMaterialIds is not null && response.Items.Count == 0
            ? null
            : response;
    }

    public async Task<SupplyInvoiceResponse> CreateAsync(UpsertSupplyInvoiceRequest request)
    {
        await _systemAccess.EnsureAccessAsync(SystemPermission.ManageSupplies);
        await ValidateItemsAsync(request.Items);

        var invoice = new SupplyInvoice(
            _currentUser.UserId,
            request.Supplier,
            request.InvoiceNumber,
            request.InvoiceDate,
            request.Amount,
            request.PaymentDueDate,
            request.ExpectedDeliveryDate,
            request.Comment);

        invoice.ReplaceItems(request.Items.Select(x => (x.MaterialId, x.ExpectedQuantity)));
        await _repository.AddAsync(invoice);
        await _audit.AddAsync(new AuditEvent(
            _currentUser.UserId,
            "SupplyInvoiceCreated",
            "SupplyInvoice",
            invoice.Id,
            $"Зарегистрирован счёт {invoice.InvoiceNumber} от {invoice.Supplier}."));
        await _repository.SaveChangesAsync();
        return Map(invoice);
    }

    public async Task<SupplyInvoiceResponse> UpdateAsync(Guid id, UpsertSupplyInvoiceRequest request)
    {
        await _systemAccess.EnsureAccessAsync(SystemPermission.ManageSupplies);
        await ValidateItemsAsync(request.Items);

        var invoice = await GetRequiredAsync(id);
        invoice.ChangeDetails(
            request.Supplier,
            request.InvoiceNumber,
            request.InvoiceDate,
            request.Amount,
            request.PaymentDueDate,
            request.ExpectedDeliveryDate,
            request.Comment);
        invoice.ReplaceItems(request.Items.Select(x => (x.MaterialId, x.ExpectedQuantity)));

        await _audit.AddAsync(new AuditEvent(
            _currentUser.UserId,
            "SupplyInvoiceUpdated",
            "SupplyInvoice",
            invoice.Id,
            $"Изменён счёт {invoice.InvoiceNumber} от {invoice.Supplier}."));
        await _repository.SaveChangesAsync();
        return Map(invoice);
    }

    public async Task<SupplyInvoiceResponse> ChangeStatusAsync(Guid id, string statusValue)
    {
        await _systemAccess.EnsureAccessAsync(SystemPermission.ManageSupplies);

        if (!Enum.TryParse<SupplyInvoiceStatus>(statusValue, true, out var status))
            throw new ArgumentException("Неизвестный статус счёта.");

        var invoice = await GetRequiredAsync(id);
        invoice.ChangeStatus(status);
        await _audit.AddAsync(new AuditEvent(
            _currentUser.UserId,
            "SupplyInvoiceStatusChanged",
            "SupplyInvoice",
            invoice.Id,
            $"Статус счёта {invoice.InvoiceNumber} изменён на {status}."));
        await _repository.SaveChangesAsync();
        return Map(invoice);
    }

    public async Task<SupplyInvoiceResponse> SetAttachmentAsync(Guid id, string relativePath)
    {
        await _systemAccess.EnsureAccessAsync(SystemPermission.ManageSupplies);
        var invoice = await GetRequiredAsync(id);
        invoice.SetAttachment(relativePath);
        await _repository.SaveChangesAsync();
        return Map(invoice);
    }

    private async Task ValidateItemsAsync(IReadOnlyList<UpsertSupplyInvoiceItemRequest> items)
    {
        if (items is null || items.Count == 0)
            throw new ArgumentException("Счёт должен содержать хотя бы один материал.");

        foreach (var item in items)
        {
            var material = await _materials.GetByIdAsync(item.MaterialId)
                ?? throw new InvalidOperationException("Материал не найден.");

            if (!material.IsActive)
                throw new InvalidOperationException($"Материал '{material.Name}' находится в архиве.");

            if (material.Kind == MaterialKind.Oracal641)
                throw new InvalidOperationException(
                    "ORACAL 641 учитывается отдельно и не добавляется в обычные счета поставки.");

            await _categoryAccess.EnsureAccessAsync(material.CategoryId, CategoryPermission.View);
        }
    }

    private async Task<SupplyInvoice> GetRequiredAsync(Guid id) =>
        await _repository.GetByIdAsync(id)
        ?? throw new InvalidOperationException("Счёт не найден.");

    private async Task<HashSet<Guid>?> GetVisibleMaterialIdsAsync()
    {
        var allowedCategories = await _categoryAccess.GetAllowedCategoryIdsAsync(CategoryPermission.View);

        if (allowedCategories is null)
            return null;

        return (await _materials.GetAllAsync())
            .Where(material => allowedCategories.Contains(material.CategoryId))
            .Select(material => material.Id)
            .ToHashSet();
    }

    private static SupplyInvoiceResponse Map(
        SupplyInvoice invoice,
        HashSet<Guid>? visibleMaterialIds = null) =>
        new(
            invoice.Id,
            invoice.CreatedByUserId,
            invoice.Supplier,
            invoice.InvoiceNumber,
            invoice.InvoiceDate,
            invoice.Amount,
            invoice.PaymentDueDate,
            invoice.ExpectedDeliveryDate,
            invoice.AttachmentPath,
            invoice.Comment,
            invoice.Status.ToString(),
            invoice.CreatedAtUtc,
            invoice.UpdatedAtUtc,
            invoice.Items
                .Where(item => visibleMaterialIds is null || visibleMaterialIds.Contains(item.MaterialId))
                .Select(item =>
                new SupplyInvoiceItemResponse(
                    item.Id,
                    item.MaterialId,
                    item.ExpectedQuantity,
                    item.ReceivedQuantity,
                    item.RemainingQuantity)).ToList());
}

using AlmazManager.Application.Features.Materials.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class SetMaterialActivityHandler
{
    private readonly IMaterialRepository _materialRepository;
    private readonly ISystemAccessService _systemAccessService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IAuditEventRepository _auditEventRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IOperationRepository _operationRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public SetMaterialActivityHandler(
        IMaterialRepository materialRepository,
        ISystemAccessService systemAccessService,
        ICurrentUserService currentUserService,
        IAuditEventRepository auditEventRepository,
        IStockRepository stockRepository,
        IOperationRepository operationRepository,
        ICategoryAccessService categoryAccessService)
    {
        _materialRepository = materialRepository;
        _systemAccessService = systemAccessService;
        _currentUserService = currentUserService;
        _auditEventRepository = auditEventRepository;
        _stockRepository = stockRepository;
        _operationRepository = operationRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<MaterialResponse> HandleAsync(
        SetMaterialActivityCommand command)
    {
        if (command.MaterialId == Guid.Empty)
        {
            throw new ArgumentException(
                "Материал не указан.",
                nameof(command.MaterialId));
        }

        var material =
            await _materialRepository.GetByIdAsync(command.MaterialId);

        if (material is null)
        {
            throw new InvalidOperationException(
                "Материал не найден.");
        }

        await _categoryAccessService.EnsureAccessAsync(
            material.CategoryId,
            CategoryPermission.View);

        if (command.IsActive)
        {
            await _systemAccessService.EnsureAccessAsync(SystemPermission.RestoreMaterials);
            material.Restore();
        }
        else
        {
            await _systemAccessService.EnsureAccessAsync(SystemPermission.ArchiveMaterials);
            material.Archive();
        }

        await _auditEventRepository.AddAsync(
            new Domain.Entities.AuditEvent(
                _currentUserService.UserId,
                command.IsActive ? "MaterialRestored" : "MaterialArchived",
                "Material",
                material.Id,
                command.IsActive
                    ? $"Материал '{material.Name}' восстановлен из архива."
                    : $"Материал '{material.Name}' перемещён в архив.",
                material.Id));

        var quantity = (await _stockRepository.GetByMaterialIdAsync(material.Id))?.Quantity ?? 0;
        await _operationRepository.AddAsync(
            new Domain.Entities.Operation(
                material.Id,
                command.IsActive
                    ? Domain.Enums.OperationType.MaterialRestored
                    : Domain.Enums.OperationType.MaterialArchived,
                quantity,
                0,
                quantity,
                _currentUserService.UserId,
                null,
                false,
                null,
                command.IsActive
                    ? $"Материал '{material.Name}' восстановлен из архива."
                    : $"Материал '{material.Name}' перемещён в архив."));

        await _materialRepository.UpdateAsync(material);
        await _materialRepository.SaveChangesAsync();

        return new MaterialResponse(
            material.Id,
            material.Name,
            material.Article,
            material.CategoryId,
            material.MinimumQuantity,
            material.Unit.ToString(),
            material.IsActive);
    }
}

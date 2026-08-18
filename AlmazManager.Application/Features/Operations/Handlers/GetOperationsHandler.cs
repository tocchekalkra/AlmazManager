using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Operations.Handlers;

public sealed class GetOperationsHandler
{
    private readonly IOperationRepository _operationRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetOperationsHandler(
        IOperationRepository operationRepository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _operationRepository = operationRepository;
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<List<OperationResponse>> HandleAsync()
    {
        var operations =
            await _operationRepository.GetAllAsync();

        var materials = await _materialRepository.GetAllAsync();
        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            var visibleMaterialIds = materials
                .Where(material =>
                    allowedCategoryIds.Contains(material.CategoryId))
                .Select(material => material.Id)
                .ToHashSet();

            operations = operations
                .Where(operation =>
                    visibleMaterialIds.Contains(operation.MaterialId))
                .ToList();
        }

        return operations
            .Select(operation => new OperationResponse(
                operation.Id,
                operation.MaterialId,
                operation.Type.ToString(),
                operation.Quantity,
                operation.UserId,
                operation.CreatedAtUtc,
                operation.Comment))
            .ToList();
    }
}

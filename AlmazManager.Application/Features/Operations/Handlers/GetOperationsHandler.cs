using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Operations.Handlers;

public sealed class GetOperationsHandler
{
    private readonly IOperationRepository _operationRepository;

    public GetOperationsHandler(
        IOperationRepository operationRepository)
    {
        _operationRepository = operationRepository;
    }

    public async Task<List<OperationResponse>> HandleAsync()
    {
        var operations =
            await _operationRepository.GetAllAsync();

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

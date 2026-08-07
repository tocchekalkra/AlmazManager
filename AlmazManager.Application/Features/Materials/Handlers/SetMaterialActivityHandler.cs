using AlmazManager.Application.Features.Materials.Commands;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Materials.Handlers;

public sealed class SetMaterialActivityHandler
{
    private readonly IMaterialRepository _materialRepository;

    public SetMaterialActivityHandler(
        IMaterialRepository materialRepository)
    {
        _materialRepository = materialRepository;
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

        if (command.IsActive)
        {
            material.Restore();
        }
        else
        {
            material.Archive();
        }

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

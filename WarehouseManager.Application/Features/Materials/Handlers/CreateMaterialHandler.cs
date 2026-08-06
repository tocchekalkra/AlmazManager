using WarehouseManager.Application.Features.Materials.Commands;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Materials.Handlers;

public sealed class CreateMaterialHandler
{
    private readonly IMaterialRepository _materialRepository;

    public CreateMaterialHandler(
        IMaterialRepository materialRepository)
    {
        _materialRepository = materialRepository;
    }

    public async Task<MaterialResponse> HandleAsync(
        CreateMaterialCommand command)
    {
        if (!Enum.TryParse<MeasurementUnit>(
                command.Unit,
                true,
                out var unit))
        {
            throw new ArgumentException(
                "Неизвестная единица измерения.");
        }

        var material = new Material(
            command.Name,
            command.Article,
            command.CategoryId,
            unit,
            command.MinimumQuantity);

        await _materialRepository.AddAsync(material);
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
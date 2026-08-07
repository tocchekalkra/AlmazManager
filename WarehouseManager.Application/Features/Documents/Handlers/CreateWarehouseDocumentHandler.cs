using WarehouseManager.Application.Features.Documents.Commands;
using WarehouseManager.Contracts.Responses.Documents;
using WarehouseManager.Domain.Entities;
using WarehouseManager.Domain.Enums;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Documents.Handlers;

public sealed class CreateWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly IUserRepository _userRepository;

    public CreateWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IUserRepository userRepository)
    {
        _documentRepository = documentRepository;
        _materialRepository = materialRepository;
        _userRepository = userRepository;
    }

    public async Task<WarehouseDocumentResponse> HandleAsync(
        CreateWarehouseDocumentCommand command)
    {
        if (!Enum.TryParse<WarehouseDocumentType>(
                command.Type,
                true,
                out var type))
        {
            throw new ArgumentException(
                "Неизвестный тип документа.");
        }

        var user = await _userRepository.GetByIdAsync(
            command.UserId);

        if (user is null)
        {
            throw new InvalidOperationException(
                "Пользователь не найден.");
        }

        if (!user.IsActive)
        {
            throw new InvalidOperationException(
                "Пользователь заблокирован.");
        }

        if (command.Items is null ||
            command.Items.Count == 0)
        {
            throw new ArgumentException(
                "Документ должен содержать хотя бы одну позицию.");
        }

        var duplicates = command.Items
            .GroupBy(x => x.MaterialId)
            .Where(x => x.Count() > 1)
            .Any();

        if (duplicates)
        {
            throw new InvalidOperationException(
                "Один материал нельзя добавлять в документ несколько раз.");
        }

        foreach (var item in command.Items)
        {
            if (item.Quantity <= 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(item.Quantity),
                    "Количество должно быть больше нуля.");
            }

            var material =
                await _materialRepository.GetByIdAsync(
                    item.MaterialId);

            if (material is null)
            {
                throw new InvalidOperationException(
                    $"Материал {item.MaterialId} не найден.");
            }

            if (!material.IsActive)
            {
                throw new InvalidOperationException(
                    $"Материал '{material.Name}' находится в архиве.");
            }
        }

        var number = GenerateDocumentNumber(type);

        var document = new WarehouseDocument(
            number,
            type,
            command.UserId,
            command.Comment);

        foreach (var item in command.Items)
        {
            document.AddItem(
                item.MaterialId,
                item.Quantity);
        }

        await _documentRepository.AddAsync(document);
        await _documentRepository.SaveChangesAsync();

        return Map(document);
    }

    private static string GenerateDocumentNumber(
        WarehouseDocumentType type)
    {
        var prefix = type switch
        {
            WarehouseDocumentType.Receiving => "RCV",
            WarehouseDocumentType.Issue => "ISS",
            _ => "DOC"
        };

        var suffix = Guid.NewGuid()
            .ToString("N")[..6]
            .ToUpperInvariant();

        return $"{prefix}-{DateTime.UtcNow:yyyyMMddHHmmss}-{suffix}";
    }

    private static WarehouseDocumentResponse Map(
        WarehouseDocument document)
    {
        return new WarehouseDocumentResponse(
            document.Id,
            document.Number,
            document.Type.ToString(),
            document.Status.ToString(),
            document.UserId,
            document.Comment,
            document.CreatedAtUtc,
            document.PostedAtUtc,
            document.CancelledAtUtc,
            document.Items
                .Select(x =>
                    new WarehouseDocumentItemResponse(
                        x.Id,
                        x.MaterialId,
                        x.Quantity))
                .ToList());
    }
}
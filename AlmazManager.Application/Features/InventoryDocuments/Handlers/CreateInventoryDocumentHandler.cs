using AlmazManager.Application.Features.InventoryDocuments.Commands;
using AlmazManager.Contracts.Responses.InventoryDocuments;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments.Handlers;

public sealed class CreateInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository _documentRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly IStockRepository _stockRepository;
    private readonly IUserRepository _userRepository;

    public CreateInventoryDocumentHandler(
        IInventoryDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IUserRepository userRepository)
    {
        _documentRepository = documentRepository;
        _materialRepository = materialRepository;
        _stockRepository = stockRepository;
        _userRepository = userRepository;
    }

    public async Task<InventoryDocumentResponse> HandleAsync(
        CreateInventoryDocumentCommand command)
    {
        var user =
            await _userRepository.GetByIdAsync(
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
                "Инвентаризация должна содержать хотя бы один материал.");
        }

        if (command.Items
            .GroupBy(x => x.MaterialId)
            .Any(x => x.Count() > 1))
        {
            throw new InvalidOperationException(
                "Один материал нельзя добавлять несколько раз.");
        }

        var document =
            new InventoryDocument(
                command.UserId,
                GenerateNumber(),
                command.Comment);

        foreach (var item in command.Items)
        {
            if (item.ActualQuantity < 0)
            {
                throw new ArgumentOutOfRangeException(
                    nameof(item.ActualQuantity),
                    "Фактическое количество не может быть отрицательным.");
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

            var stock =
                await _stockRepository.GetByMaterialIdAsync(
                    item.MaterialId);

            var expectedQuantity =
                stock?.Quantity ?? 0;

            document.AddItem(
                item.MaterialId,
                expectedQuantity,
                item.ActualQuantity);
        }

        await _documentRepository.AddAsync(
            document);

        await _documentRepository.SaveChangesAsync();

        return await InventoryDocumentMapper.MapAsync(
            document,
            _materialRepository);
    }

    private static string GenerateNumber()
    {
        var suffix =
            Guid.NewGuid()
                .ToString("N")[..6]
                .ToUpperInvariant();

        return
            $"INV-{DateTime.UtcNow:yyyyMMddHHmmss}-{suffix}";
    }
}

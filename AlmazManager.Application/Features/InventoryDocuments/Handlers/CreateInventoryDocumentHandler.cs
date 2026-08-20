using AlmazManager.Application.Features.InventoryDocuments.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.InventoryDocuments;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.InventoryDocuments.Handlers;

public sealed class CreateInventoryDocumentHandler
{
    private readonly IInventoryDocumentRepository
        _documentRepository;

    private readonly IMaterialRepository
        _materialRepository;

    private readonly IStockRepository
        _stockRepository;

    private readonly IUserRepository
        _userRepository;

    private readonly ICurrentUserService
        _currentUserService;

    private readonly ICategoryAccessService
        _categoryAccessService;

    public CreateInventoryDocumentHandler(
        IInventoryDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IStockRepository stockRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUserService,
        ICategoryAccessService categoryAccessService)
    {
        _documentRepository =
            documentRepository;

        _materialRepository =
            materialRepository;

        _stockRepository =
            stockRepository;

        _userRepository =
            userRepository;

        _currentUserService =
            currentUserService;

        _categoryAccessService =
            categoryAccessService;
    }

    public async Task<InventoryDocumentResponse>
        HandleAsync(
            CreateInventoryDocumentCommand command)
    {
        var currentUserId =
            _currentUserService.UserId;

        var user =
            await _userRepository
                .GetByIdAsync(
                    currentUserId);

        if (user is null)
        {
            throw new InvalidOperationException(
                "Текущий пользователь не найден.");
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
                currentUserId,
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
                await _materialRepository
                    .GetByIdAsync(
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

            if (material.Kind == MaterialKind.Standard &&
                item.ActualQuantity != decimal.Truncate(item.ActualQuantity))
            {
                throw new ArgumentException(
                    $"Для материала '{material.Name}' количество должно быть целым.");
            }

            /*
             * Для ORACAL используется отдельное право.
             * Для остальных материалов —
             * право инвентаризации основного склада.
             */
            var permission =
                material.Kind ==
                MaterialKind.Oracal641
                    ? CategoryPermission.InventoryOracal
                    : CategoryPermission.InventoryStandard;

            await _categoryAccessService
                .EnsureAccessAsync(
                    material.CategoryId,
                    permission);

            var stock =
                await _stockRepository
                    .GetByMaterialIdAsync(
                        item.MaterialId);

            var expectedQuantity =
                stock?.Quantity ?? 0;

            document.AddItem(
                item.MaterialId,
                expectedQuantity,
                item.ActualQuantity);
        }

        await _documentRepository
            .AddAsync(document);

        await _documentRepository
            .SaveChangesAsync();

        return await InventoryDocumentMapper
            .MapAsync(
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

using AlmazManager.Application.Features.Documents.Commands;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses.Documents;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Documents.Handlers;

public sealed class CreateWarehouseDocumentHandler
{
    private readonly IWarehouseDocumentRepository
        _documentRepository;

    private readonly IMaterialRepository
        _materialRepository;

    private readonly IUserRepository
        _userRepository;

    private readonly ICurrentUserService
        _currentUserService;

    private readonly ICategoryAccessService
        _categoryAccessService;

    public CreateWarehouseDocumentHandler(
        IWarehouseDocumentRepository documentRepository,
        IMaterialRepository materialRepository,
        IUserRepository userRepository,
        ICurrentUserService currentUserService,
        ICategoryAccessService categoryAccessService)
    {
        _documentRepository =
            documentRepository;

        _materialRepository =
            materialRepository;

        _userRepository =
            userRepository;

        _currentUserService =
            currentUserService;

        _categoryAccessService =
            categoryAccessService;
    }

    public async Task<WarehouseDocumentResponse>
        HandleAsync(
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

        if (!Enum.IsDefined(type))
        {
            throw new ArgumentException(
                "Неизвестный тип документа.");
        }

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
                "Документ должен содержать хотя бы одну позицию.");
        }

        var duplicates =
            command.Items
                .GroupBy(x => x.MaterialId)
                .Any(x => x.Count() > 1);

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
                item.Quantity != decimal.Truncate(item.Quantity))
            {
                throw new ArgumentException(
                    $"Для материала '{material.Name}' количество должно быть целым.");
            }

            var permission =
                type ==
                WarehouseDocumentType.Receiving
                    ? CategoryPermission.Receive
                    : CategoryPermission.Issue;

            await _categoryAccessService
                .EnsureAccessAsync(
                    material.CategoryId,
                    permission);
        }

        var document =
            new WarehouseDocument(
                $"Черновик-{Guid.NewGuid():N}",
                type,
                currentUserId,
                command.DocumentDate,
                command.SupplyInvoiceId,
                command.Supplier,
                command.ExternalNumber,
                command.Recipient,
                command.Comment);

        foreach (var item in command.Items)
        {
            document.AddItem(
                item.MaterialId,
                item.Quantity);
        }

        await _documentRepository
            .AddAsync(document);

        await _documentRepository
            .SaveChangesAsync();

        return Map(document);
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
            document.SequenceNumber,
            document.DocumentDate,
            document.SupplyInvoiceId,
            document.Supplier,
            document.ExternalNumber,
            document.Recipient,
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

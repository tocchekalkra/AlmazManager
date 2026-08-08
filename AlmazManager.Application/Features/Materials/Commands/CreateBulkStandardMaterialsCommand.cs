namespace AlmazManager.Application.Features.Materials.Commands;

public sealed record CreateBulkStandardMaterialsCommand(
    string Name,
    string ArticlePrefix,
    Guid CategoryId,
    decimal MinimumQuantity,
    List<decimal> Widths);
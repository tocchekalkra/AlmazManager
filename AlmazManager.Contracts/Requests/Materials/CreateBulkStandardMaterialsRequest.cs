namespace AlmazManager.Contracts.Requests.Materials;

public sealed record CreateBulkStandardMaterialsRequest(
    string Name,
    string ArticlePrefix,
    Guid CategoryId,
    decimal MinimumQuantity,
    List<decimal> Widths);
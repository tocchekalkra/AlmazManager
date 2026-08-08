namespace AlmazManager.Contracts.Responses;

public sealed record DashboardResponse(
    int TotalMaterials,
    int ActiveMaterials,
    int TotalCategories,
    decimal TotalQuantity,
    int MaterialsWithStock,
    int MaterialsWithoutStock,
    int BelowMinimumCount,
    int TotalOperations,
    int ReceivingOperations,
    int IssueOperations,
    int InventoryOperations,
    IReadOnlyList<DashboardAttentionMaterialResponse>? AttentionMaterials = null,
    IReadOnlyList<DashboardRecentOperationResponse>? RecentOperations = null);

public sealed record DashboardAttentionMaterialResponse(
    Guid MaterialId,
    string Name,
    string Article,
    string Category,
    decimal Quantity,
    decimal MinimumQuantity,
    string Unit,
    string Status);

public sealed record DashboardRecentOperationResponse(
    Guid OperationId,
    DateTime CreatedAtUtc,
    string Type,
    string MaterialName,
    decimal QuantityChange,
    string Unit,
    Guid UserId,
    string UserFullName,
    string UserLogin);
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
    int ReceivingToday,
    int IssueToday,
    int IssueYesterday,
    IReadOnlyList<DashboardAttentionMaterialResponse>? AttentionMaterials = null,
    IReadOnlyList<DashboardRecentOperationResponse>? RecentOperations = null,
    IReadOnlyList<DashboardRecentDocumentResponse>? RecentDocuments = null,
    IReadOnlyList<DashboardConsumptionDayResponse>? ConsumptionDays = null,
    IReadOnlyList<DashboardInkMachineResponse>? InkByMachine = null);

public sealed record DashboardInkMachineResponse(
    string MachineName,
    decimal TotalLiters,
    IReadOnlyList<DashboardInkColorResponse> Colors);

public sealed record DashboardInkColorResponse(
    string ColorName,
    string ColorHex,
    decimal QuantityLiters,
    decimal MinimumLiters,
    bool BelowMinimum);

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

public sealed record DashboardRecentDocumentResponse(
    Guid DocumentId,
    string Number,
    string Type,
    DateTime CreatedAtUtc,
    DateTime? PostedAtUtc,
    Guid UserId,
    string UserFullName,
    string? Recipient,
    int ItemCount,
    string Summary);

public sealed record DashboardConsumptionDayResponse(
    DateOnly Date,
    int DocumentCount,
    int ItemCount,
    string? TopMaterial);

public sealed record ConsumptionStatisticsResponse(
    DateOnly From,
    DateOnly To,
    IReadOnlyList<ConsumptionStatisticsDayResponse> Days);

public sealed record ConsumptionStatisticsDayResponse(
    DateOnly Date,
    int DocumentCount,
    int ItemCount,
    IReadOnlyList<ConsumptionStatisticsItemResponse> Items);

public sealed record ConsumptionStatisticsItemResponse(
    Guid DocumentId,
    string DocumentNumber,
    DateTime? PostedAtUtc,
    Guid MaterialId,
    string MaterialName,
    decimal Quantity,
    string Unit,
    string? Recipient,
    Guid UserId,
    string UserFullName);

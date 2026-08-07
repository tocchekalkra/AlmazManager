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
    int InventoryOperations);

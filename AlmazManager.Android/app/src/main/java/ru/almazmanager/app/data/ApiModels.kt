package ru.almazmanager.app.data

data class LoginRequest(
    val login: String,
    val password: String,
)

data class LoginResponse(
    val accessToken: String,
    val tokenType: String,
    val expiresAtUtc: String,
    val userId: String,
    val fullName: String,
    val login: String,
    val role: String,
)

data class CurrentUserAccess(
    val canInventoryStandard: Boolean = false,
    val canInventoryOracal: Boolean = false,
    val canManageMaterials: Boolean = false,
    val canArchiveMaterials: Boolean = false,
    val canRestoreMaterials: Boolean = false,
    val canPermanentlyDeleteMaterials: Boolean = false,
    val canCancelDocuments: Boolean = false,
    val canManageSupplies: Boolean = false,
    val theme: String = "System",
)

data class DashboardResponse(
    val totalMaterials: Int = 0,
    val activeMaterials: Int = 0,
    val totalCategories: Int = 0,
    val totalQuantity: Double = 0.0,
    val materialsWithStock: Int = 0,
    val materialsWithoutStock: Int = 0,
    val belowMinimumCount: Int = 0,
    val totalOperations: Int = 0,
    val receivingOperations: Int = 0,
    val issueOperations: Int = 0,
    val inventoryOperations: Int = 0,
    val receivingToday: Int = 0,
    val issueToday: Int = 0,
    val issueYesterday: Int = 0,
    val attentionMaterials: List<DashboardAttentionMaterial> = emptyList(),
    val recentOperations: List<DashboardRecentOperation> = emptyList(),
    val recentDocuments: List<DashboardRecentDocument> = emptyList(),
    val consumptionDays: List<DashboardConsumptionDay> = emptyList(),
)

data class DashboardAttentionMaterial(
    val materialId: String,
    val name: String,
    val article: String,
    val category: String,
    val quantity: Double,
    val minimumQuantity: Double,
    val unit: String,
    val status: String,
)

data class DashboardRecentOperation(
    val operationId: String,
    val createdAtUtc: String,
    val type: String,
    val materialName: String,
    val quantityChange: Double,
    val unit: String,
    val userId: String,
    val userFullName: String,
    val userLogin: String,
)

data class DashboardRecentDocument(
    val documentId: String,
    val number: String,
    val type: String,
    val createdAtUtc: String,
    val postedAtUtc: String? = null,
    val userFullName: String,
    val recipient: String? = null,
    val itemCount: Int,
    val summary: String,
)

data class DashboardConsumptionDay(
    val date: String,
    val documentCount: Int,
    val itemCount: Int,
    val topMaterial: String? = null,
)

data class MaterialCatalogResponse(
    val page: Int,
    val pageSize: Int,
    val totalCount: Int,
    val totalPages: Int,
    val items: List<MaterialItem>,
)

data class MaterialItem(
    val id: String,
    val name: String,
    val article: String,
    val categoryId: String,
    val categoryName: String = "Без категории",
    val unit: String,
    val minimumQuantity: Double,
    val currentQuantity: Double,
    val expectedQuantity: Double = 0.0,
    val belowMinimum: Boolean,
    val isActive: Boolean,
    val kind: String,
    val widthMeters: Double? = null,
    val colorCode: String? = null,
    val colorName: String? = null,
    val colorHex: String? = null,
)

data class CategoryItem(
    val id: String,
    val name: String,
    val isActive: Boolean,
)

data class StockCatalogResponse(
    val page: Int,
    val pageSize: Int,
    val totalCount: Int,
    val totalPages: Int,
    val totalQuantity: Double,
    val belowMinimumCount: Int,
    val withoutStockCount: Int,
    val items: List<StockItem>,
)

data class StockItem(
    val materialId: String,
    val materialName: String,
    val article: String,
    val categoryId: String,
    val categoryName: String = "Без категории",
    val unit: String,
    val kind: String = "Standard",
    val widthMeters: Double? = null,
    val colorCode: String? = null,
    val colorName: String? = null,
    val colorHex: String? = null,
    val currentQuantity: Double,
    val expectedQuantity: Double = 0.0,
    val minimumQuantity: Double,
    val differenceFromMinimum: Double,
    val belowMinimum: Boolean,
    val hasStock: Boolean,
    val isActive: Boolean,
    val updatedAtUtc: String? = null,
)

data class WarehouseDocumentCreateRequest(
    val type: String,
    val documentDate: String,
    val supplyInvoiceId: String? = null,
    val supplier: String? = null,
    val externalNumber: String? = null,
    val recipient: String? = null,
    val comment: String? = null,
    val items: List<WarehouseDocumentCreateItem>,
)

data class WarehouseDocumentCreateItem(
    val materialId: String,
    val quantity: Double,
)

data class WarehouseDocumentResponse(
    val id: String,
    val number: String,
    val type: String,
    val status: String,
    val userId: String,
    val sequenceNumber: Int? = null,
    val documentDate: String,
    val supplyInvoiceId: String? = null,
    val supplier: String? = null,
    val externalNumber: String? = null,
    val recipient: String? = null,
    val comment: String? = null,
    val createdAtUtc: String,
    val postedAtUtc: String? = null,
    val cancelledAtUtc: String? = null,
    val items: List<WarehouseDocumentItem> = emptyList(),
)

data class WarehouseDocumentItem(
    val id: String,
    val materialId: String,
    val quantity: Double,
)

data class InventoryDocumentCreateRequest(
    val comment: String? = null,
    val items: List<InventoryDocumentCreateItem>,
)

data class InventoryDocumentCreateItem(
    val materialId: String,
    val actualQuantity: Double,
)

data class InventoryDocumentResponse(
    val id: String,
    val number: String,
    val userId: String,
    val comment: String? = null,
    val status: String,
    val createdAtUtc: String,
    val postedAtUtc: String? = null,
    val cancelledAtUtc: String? = null,
    val totalItems: Int = 0,
    val changedItems: Int = 0,
    val items: List<InventoryDocumentItem> = emptyList(),
)

data class InventoryDocumentItem(
    val id: String,
    val materialId: String,
    val materialName: String,
    val article: String? = null,
    val unit: String,
    val expectedQuantity: Double,
    val actualQuantity: Double,
    val difference: Double,
)

data class OperationJournalResponse(
    val page: Int,
    val pageSize: Int,
    val totalCount: Int,
    val totalPages: Int,
    val items: List<OperationItem>,
)

data class OperationItem(
    val id: String,
    val materialId: String,
    val materialName: String,
    val materialArticle: String,
    val type: String,
    val displayType: String,
    val quantity: Double,
    val quantityBefore: Double,
    val quantityChange: Double,
    val quantityAfter: Double,
    val userId: String,
    val userName: String,
    val documentId: String? = null,
    val documentNumber: String? = null,
    val isReversal: Boolean = false,
    val reversedOperationId: String? = null,
    val createdAtUtc: String,
    val comment: String? = null,
)

data class UserPreferencesResponse(
    val theme: String = "System",
    val materialOrder: List<String> = emptyList(),
    val categoryOrder: List<String> = emptyList(),
)

data class UpdatePreferencesRequest(
    val theme: String? = null,
    val materialOrder: List<String>? = null,
    val categoryOrder: List<String>? = null,
    val resetOrder: Boolean = false,
)

data class NotificationListResponse(
    val unreadCount: Int = 0,
    val items: List<NotificationItem> = emptyList(),
)

data class NotificationItem(
    val id: String,
    val type: String,
    val title: String,
    val message: String,
    val materialId: String? = null,
    val supplyInvoiceId: String? = null,
    val createdAtUtc: String,
    val readAtUtc: String? = null,
    val resolvedAtUtc: String? = null,
)

data class SupplyInvoiceResponse(
    val id: String,
    val supplier: String,
    val invoiceNumber: String,
    val invoiceDate: String,
    val amount: Double,
    val paymentDueDate: String? = null,
    val expectedDeliveryDate: String? = null,
    val attachmentUrl: String? = null,
    val comment: String? = null,
    val status: String,
    val createdAtUtc: String,
    val updatedAtUtc: String,
    val items: List<SupplyInvoiceItem> = emptyList(),
)

data class SupplyInvoiceItem(
    val id: String,
    val materialId: String,
    val expectedQuantity: Double,
    val receivedQuantity: Double,
    val remainingQuantity: Double,
)

data class SupplyInvoiceUpsertRequest(
    val supplier: String,
    val invoiceNumber: String,
    val invoiceDate: String,
    val amount: Double,
    val paymentDueDate: String? = null,
    val expectedDeliveryDate: String? = null,
    val comment: String? = null,
    val items: List<SupplyInvoiceUpsertItem>,
)

data class SupplyInvoiceUpsertItem(
    val materialId: String,
    val expectedQuantity: Double,
)

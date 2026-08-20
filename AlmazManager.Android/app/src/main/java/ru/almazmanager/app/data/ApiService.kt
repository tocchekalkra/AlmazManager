package ru.almazmanager.app.data

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query
import retrofit2.http.PUT
import retrofit2.http.PATCH

interface ApiService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("users/me/access")
    suspend fun getCurrentUserAccess(): CurrentUserAccess

    @GET("dashboard")
    suspend fun getDashboard(): DashboardResponse

    @GET("notifications")
    suspend fun getNotifications(): NotificationListResponse

    @POST("notifications/{id}/read")
    suspend fun markNotificationRead(@Path("id") id: String)

    @GET("preferences")
    suspend fun getPreferences(): UserPreferencesResponse

    @PUT("preferences")
    suspend fun updatePreferences(@Body request: UpdatePreferencesRequest): UserPreferencesResponse

    @GET("supplies")
    suspend fun getSupplies(): List<SupplyInvoiceResponse>

    @POST("supplies")
    suspend fun createSupply(
        @Body request: SupplyInvoiceUpsertRequest,
    ): SupplyInvoiceResponse

    @PUT("supplies/{id}")
    suspend fun updateSupply(
        @Path("id") id: String,
        @Body request: SupplyInvoiceUpsertRequest,
    ): SupplyInvoiceResponse

    @PATCH("supplies/{id}/status")
    suspend fun updateSupplyStatus(
        @Path("id") id: String,
        @Body request: Map<String, String>,
    ): SupplyInvoiceResponse

    @GET("categories")
    suspend fun getCategories(): List<CategoryItem>

    @GET("materials/catalog")
    suspend fun getMaterials(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 2000,
        @Query("search") search: String? = null,
    ): MaterialCatalogResponse

    @GET("stocks/catalog")
    suspend fun getStocks(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 2000,
        @Query("search") search: String? = null,
        @Query("belowMinimum") belowMinimum: Boolean? = null,
    ): StockCatalogResponse

    @POST("documents")
    suspend fun createWarehouseDocument(
        @Body request: WarehouseDocumentCreateRequest,
    ): WarehouseDocumentResponse

    @POST("documents/{id}/post")
    suspend fun postWarehouseDocument(
        @Path("id") id: String,
    ): WarehouseDocumentResponse

    @GET("documents")
    suspend fun getWarehouseDocuments(): List<WarehouseDocumentResponse>

    @POST("inventory-documents")
    suspend fun createInventoryDocument(
        @Body request: InventoryDocumentCreateRequest,
    ): InventoryDocumentResponse

    @POST("inventory-documents/{id}/post")
    suspend fun postInventoryDocument(
        @Path("id") id: String,
    ): InventoryDocumentResponse

    @GET("inventory-documents")
    suspend fun getInventoryDocuments(): List<InventoryDocumentResponse>

    @GET("operations/journal")
    suspend fun getOperations(
        @Query("page") page: Int = 1,
        @Query("pageSize") pageSize: Int = 100,
        @Query("search") search: String? = null,
        @Query("type") type: String? = null,
    ): OperationJournalResponse
}

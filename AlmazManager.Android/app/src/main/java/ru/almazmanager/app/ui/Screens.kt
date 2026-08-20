package ru.almazmanager.app.ui

import android.app.DatePickerDialog
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.ExpandLess
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Opacity
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.WarningAmber
import androidx.compose.material.icons.filled.Warehouse
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import ru.almazmanager.app.data.ApiClient
import ru.almazmanager.app.data.ApiService
import ru.almazmanager.app.data.DashboardResponse
import ru.almazmanager.app.data.CategoryItem
import ru.almazmanager.app.data.InventoryDocumentCreateItem
import ru.almazmanager.app.data.InventoryDocumentCreateRequest
import ru.almazmanager.app.data.InventoryDocumentResponse
import ru.almazmanager.app.data.MaterialItem
import ru.almazmanager.app.data.OperationItem
import ru.almazmanager.app.data.NotificationItem
import ru.almazmanager.app.data.StockItem
import ru.almazmanager.app.data.SupplyInvoiceResponse
import ru.almazmanager.app.data.SupplyInvoiceUpsertItem
import ru.almazmanager.app.data.SupplyInvoiceUpsertRequest
import ru.almazmanager.app.data.UpdatePreferencesRequest
import ru.almazmanager.app.data.WarehouseDocumentCreateItem
import ru.almazmanager.app.data.WarehouseDocumentCreateRequest
import ru.almazmanager.app.data.WarehouseDocumentResponse
import ru.almazmanager.app.data.loadAllMaterials
import ru.almazmanager.app.data.loadAllStocks
import java.text.DecimalFormat
import java.time.OffsetDateTime
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

private val numberFormat = DecimalFormat("#,##0.##")
private val dateFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")

@Composable
fun DashboardScreen(
    api: ApiService,
    fullName: String,
    onOpenStock: () -> Unit,
    onOpenDocuments: () -> Unit,
) {
    var data by remember { mutableStateOf<DashboardResponse?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            error = ""
            data = api.getDashboard()
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        Card(
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.10f),
            ),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.25f)),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth().padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                    Text(
                        "ALMAZMANAGER",
                        style = MaterialTheme.typography.labelMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                    )
                    Text(
                        "Добрый день, ${fullName.ifBlank { "сотрудник" }}",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        "Главное по складу на текущий момент",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        LocalDate.now().format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale("ru"))),
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                IconButton(onClick = { refreshKey += 1 }) {
                    Icon(Icons.Default.Refresh, contentDescription = "Обновить")
                }
            }
        }

        if (loading) {
            LoadingBlock()
            return@Column
        }

        if (error.isNotBlank()) {
            ErrorBlock(error)
            return@Column
        }

        val dashboard = data ?: return@Column

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            DashboardMetricCard(
                label = "Материалов",
                hint = "Активные позиции",
                value = dashboard.activeMaterials.toString(),
                icon = Icons.Default.Warehouse,
                tone = MaterialTheme.colorScheme.primary,
                modifier = Modifier.weight(1f),
                onClick = onOpenStock,
            )
            DashboardMetricCard(
                label = "Ниже минимума",
                hint = "Требуют внимания",
                value = dashboard.belowMinimumCount.toString(),
                icon = Icons.Default.WarningAmber,
                tone = Color(0xFFFFB454),
                modifier = Modifier.weight(1f),
                onClick = onOpenStock,
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            DashboardMetricCard(
                label = "Приход сегодня",
                hint = "Проведённые позиции",
                value = dashboard.receivingToday.toString(),
                icon = Icons.Default.ArrowDownward,
                tone = MaterialTheme.colorScheme.secondary,
                modifier = Modifier.weight(1f),
                onClick = onOpenDocuments,
            )
            DashboardMetricCard(
                label = "Расход сегодня",
                hint = "Проведённые позиции",
                value = dashboard.issueToday.toString(),
                icon = Icons.Default.ArrowUpward,
                tone = MaterialTheme.colorScheme.error,
                modifier = Modifier.weight(1f),
                onClick = onOpenDocuments,
            )
        }
        DashboardMetricCard(
            label = "Выдано вчера",
            hint = "Проведённые позиции",
            value = dashboard.issueYesterday.toString(),
            icon = Icons.Default.CalendarMonth,
            tone = MaterialTheme.colorScheme.primary,
            modifier = Modifier.fillMaxWidth(),
            onClick = onOpenDocuments,
        )
        dashboard.inkByMachine.forEach { machine ->
            DashboardMetricCard(
                label = machine.machineName,
                hint = "Общий остаток краски",
                value = "${numberFormat.format(machine.totalLiters)} л",
                icon = Icons.Default.Opacity,
                tone = MaterialTheme.colorScheme.primary,
                modifier = Modifier.fillMaxWidth(),
                onClick = onOpenStock,
            )
        }

        val maxActivity = maxOf(1, dashboard.consumptionDays.maxOfOrNull { it.itemCount } ?: 1)
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
        ) {
            Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.BarChart, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(8.dp))
                    Column(Modifier.weight(1f)) {
                        Text("Расход материалов по дням", fontWeight = FontWeight.Bold)
                        Text(
                            "Последние 7 дней",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Bottom,
                ) {
                    dashboard.consumptionDays.forEach { day ->
                        val barHeight = (18 + 62 * day.itemCount / maxActivity).dp
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text(day.itemCount.toString(), style = MaterialTheme.typography.labelSmall)
                            Spacer(Modifier.height(4.dp))
                            Box(
                                Modifier.width(24.dp).height(barHeight).background(
                                    MaterialTheme.colorScheme.primary.copy(alpha = 0.75f),
                                    RoundedCornerShape(topStart = 7.dp, topEnd = 7.dp),
                                ),
                            )
                            Spacer(Modifier.height(5.dp))
                            Text(
                                day.date.takeLast(5).replace('-', '.'),
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
                if (dashboard.consumptionDays.isEmpty()) {
                    Text("За последние дни расхода не было.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }
        }

        DashboardPanel(
            title = "Требуют внимания",
            subtitle = "Три наиболее критичные позиции",
            icon = Icons.Default.WarningAmber,
            actionLabel = "Показать все",
            onAction = onOpenStock,
        ) {
            if (dashboard.attentionMaterials.isEmpty()) {
                SuccessBlock("Все доступные материалы находятся в норме.")
            } else {
                dashboard.attentionMaterials.take(3).forEachIndexed { index, material ->
                    if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(
                                material.name + filmMarkerText(material.category)
                                    .let { if (it.isBlank()) "" else " · $it" },
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                "${material.article} · ${material.category}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text(
                                "${numberFormat.format(material.quantity)} ${unitLabel(material.unit)}",
                                color = MaterialTheme.colorScheme.error,
                                fontWeight = FontWeight.Bold,
                            )
                            Text(
                                "мин. ${numberFormat.format(material.minimumQuantity)}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }
        }

        DashboardPanel(
            title = "Последние документы",
            subtitle = "Три последние складские операции",
            icon = Icons.Default.Description,
            actionLabel = "Открыть журнал",
            onAction = onOpenDocuments,
        ) {
            if (dashboard.recentDocuments.isEmpty()) {
                Text("Операций пока нет.", color = MaterialTheme.colorScheme.onSurfaceVariant)
            } else {
                dashboard.recentDocuments.take(3).forEachIndexed { index, document ->
                    if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant)
                    Row(
                        modifier = Modifier.fillMaxWidth().clickable(onClick = onOpenDocuments).padding(vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Box(
                            Modifier.size(36.dp).background(
                                if (document.type == "Receiving") MaterialTheme.colorScheme.secondary.copy(alpha = 0.14f)
                                else MaterialTheme.colorScheme.error.copy(alpha = 0.12f),
                                RoundedCornerShape(10.dp),
                            ),
                            contentAlignment = Alignment.Center,
                        ) {
                            Icon(
                                if (document.type == "Receiving") Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                                contentDescription = null,
                                tint = if (document.type == "Receiving") MaterialTheme.colorScheme.secondary else MaterialTheme.colorScheme.error,
                            )
                        }
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text(
                                "${document.number} · ${documentTypeLabel(document.type)}",
                                fontWeight = FontWeight.SemiBold,
                            )
                            Text(
                                document.summary.ifBlank { "Состав не указан" },
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                maxLines = 2,
                            )
                        }
                        Text("${document.itemCount} поз.", style = MaterialTheme.typography.labelMedium)
                    }
                }
            }
        }
    }
}

private data class StockMaterialGroup(
    val key: String,
    val name: String,
    val items: List<StockItem>,
)

private data class StockCategoryGroup(
    val id: String,
    val name: String,
    val materials: List<StockMaterialGroup>,
)

@Composable
fun StockScreen(api: ApiService) {
    var allItems by remember { mutableStateOf<List<StockItem>>(emptyList()) }
    var search by remember { mutableStateOf("") }
    var onlyLow by remember { mutableStateOf(false) }
    var orderMode by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }
    var savingOrder by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            error = ""
            allItems = api.loadAllStocks()
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    val filtered = allItems.filter { item ->
        val query = search.trim()
        (query.isBlank() || item.materialName.contains(query, true) || item.article.contains(query, true) ||
            item.categoryName.contains(query, true) || item.colorCode?.contains(query, true) == true) &&
            (!onlyLow || item.belowMinimum)
    }
    val grouped = filtered
        .groupBy { it.categoryId }
        .map { (categoryId, categoryItems) ->
            StockCategoryGroup(
                id = categoryId,
                name = if (categoryItems.firstOrNull()?.kind == "Oracal641")
                    "ORACAL 641"
                else
                    categoryItems.firstOrNull()?.categoryName ?: "Без категории",
                materials = categoryItems
                    .groupBy(::stockBaseName)
                    .map { (materialName, widths) ->
                        StockMaterialGroup(
                            key = materialName,
                            name = materialName,
                            items = widths.sortedByDescending { it.widthMeters ?: 0.0 },
                        )
                    },
            )
        }

    fun moveMaterialGroup(categoryId: String, materialKey: String, direction: Int) {
        if (!orderMode || savingOrder) return
        val categoryItems = allItems.filter { it.categoryId == categoryId }
        val materialGroups = categoryItems.groupBy(::stockBaseName).entries.toMutableList()
        val from = materialGroups.indexOfFirst { it.key == materialKey }
        if (from < 0) return
        val to = (from + direction).coerceIn(0, materialGroups.lastIndex)
        if (from == to) return
        val moved = materialGroups.removeAt(from)
        materialGroups.add(to, moved)

        val reorderedCategory = materialGroups.flatMap { entry ->
            entry.value.sortedByDescending { it.widthMeters ?: 0.0 }
        }
        val firstCategoryIndex = allItems.indexOfFirst { it.categoryId == categoryId }
        val next = allItems.filterNot { it.categoryId == categoryId }.toMutableList()
        next.addAll(firstCategoryIndex.coerceAtLeast(0).coerceAtMost(next.size), reorderedCategory)
        allItems = next

        scope.launch {
            try {
                savingOrder = true
                error = ""
                api.updatePreferences(
                    UpdatePreferencesRequest(materialOrder = next.map { it.materialId }),
                )
            } catch (requestError: Throwable) {
                error = ApiClient.errorMessage(requestError)
                refreshKey += 1
            } finally {
                savingOrder = false
            }
        }
    }

    fun moveCategory(categoryId: String, direction: Int) {
        if (!orderMode || savingOrder) return
        val categoryOrder = allItems.map { it.categoryId }.distinct().toMutableList()
        val from = categoryOrder.indexOf(categoryId)
        val to = (from + direction).coerceIn(0, categoryOrder.lastIndex)
        if (from < 0 || from == to) return
        val moved = categoryOrder.removeAt(from)
        categoryOrder.add(to, moved)

        val orderIndex = categoryOrder.withIndex().associate { it.value to it.index }
        allItems = allItems.withIndex()
            .sortedWith(
                compareBy<IndexedValue<StockItem>> { orderIndex[it.value.categoryId] ?: Int.MAX_VALUE }
                    .thenBy { it.index },
            )
            .map { it.value }

        scope.launch {
            try {
                savingOrder = true
                error = ""
                api.updatePreferences(UpdatePreferencesRequest(categoryOrder = categoryOrder))
            } catch (requestError: Throwable) {
                error = ApiClient.errorMessage(requestError)
                refreshKey += 1
            } finally {
                savingOrder = false
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader("Остатки", "${filtered.size} позиций", onRefresh = { refreshKey += 1 })

        OutlinedButton(
            onClick = { orderMode = !orderMode },
            enabled = search.isBlank() && !onlyLow && !savingOrder,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(
                if (orderMode) Icons.Default.Lock else Icons.Default.LockOpen,
                contentDescription = null,
            )
            Spacer(Modifier.width(8.dp))
            Text(
                when {
                    savingOrder -> "Сохранение..."
                    orderMode -> "Завершить порядок"
                    else -> "Изменить порядок"
                },
            )
        }

        Text(
            if (orderMode)
                "Перемещение включено. Порядок сохраняется только для вас."
            else
                "Перемещение заблокировано от случайных действий.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        OutlinedTextField(
            value = search,
            onValueChange = { search = it; orderMode = false },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Поиск материала") },
            singleLine = true,
        )

        OutlinedButton(onClick = { onlyLow = !onlyLow; orderMode = false }) {
            Text(if (onlyLow) "Показать все" else "Только ниже минимума")
        }

        if (loading) {
            LoadingBlock()
        } else if (error.isNotBlank()) {
            ErrorBlock(error)
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                grouped.forEachIndexed { categoryIndex, category ->
                    item(key = "category-${category.id}") {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(top = 10.dp, bottom = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Text(
                                category.name,
                                modifier = Modifier.weight(1f),
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary,
                            )
                            if (orderMode) {
                                IconButton(
                                    onClick = { moveCategory(category.id, -1) },
                                    enabled = categoryIndex > 0,
                                ) { Text("↑", fontWeight = FontWeight.Bold) }
                                IconButton(
                                    onClick = { moveCategory(category.id, 1) },
                                    enabled = categoryIndex < grouped.lastIndex,
                                ) { Text("↓", fontWeight = FontWeight.Bold) }
                            }
                        }
                    }

                    category.materials.forEachIndexed { materialIndex, materialGroup ->
                        item(key = "stock-material-${category.id}-${materialGroup.key}") {
                            Card(
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.primary.copy(alpha = 0.20f)),
                            ) {
                                Column(Modifier.fillMaxWidth().padding(12.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        materialGroup.items.firstOrNull()?.takeIf {
                                            (it.kind == "Oracal641" || it.kind == "Ink") && !it.colorHex.isNullOrBlank()
                                        }?.let { first ->
                                            Box(
                                                Modifier.size(26.dp).background(
                                                    parseHexColor(first.colorHex.orEmpty()),
                                                    RoundedCornerShape(7.dp),
                                                ),
                                            )
                                            Spacer(Modifier.width(9.dp))
                                        }
                                        Column(Modifier.weight(1f)) {
                                            Text(
                                                materialGroup.name,
                                                style = MaterialTheme.typography.titleMedium,
                                                fontWeight = FontWeight.Bold,
                                            )
                                            filmDescription(category.name).takeIf { it.isNotBlank() }?.let { film ->
                                                Text(
                                                    film,
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.primary,
                                                )
                                            }
                                        }
                                        if (orderMode) {
                                            IconButton(
                                                onClick = { moveMaterialGroup(category.id, materialGroup.key, -1) },
                                                enabled = materialIndex > 0,
                                            ) { Text("↑", fontWeight = FontWeight.Bold) }
                                            IconButton(
                                                onClick = { moveMaterialGroup(category.id, materialGroup.key, 1) },
                                                enabled = materialIndex < category.materials.lastIndex,
                                            ) { Text("↓", fontWeight = FontWeight.Bold) }
                                        }
                                    }

                                    HorizontalDivider(Modifier.padding(vertical = 8.dp))
                                    materialGroup.items.forEachIndexed { widthIndex, stock ->
                                        if (widthIndex > 0) {
                                            HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f))
                                        }
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(vertical = 9.dp),
                                            verticalAlignment = Alignment.CenterVertically,
                                        ) {
                                            Column(Modifier.weight(1f)) {
                                                Text(
                                                    if (stock.kind == "Ink") {
                                                        "${stock.colorName ?: "Без цвета"} · ${numberFormat.format(stock.packageLiters ?: 0.0)} л"
                                                    } else {
                                                        stock.widthMeters?.let { "${numberFormat.format(it)} м" } ?: "Без ширины"
                                                    },
                                                    fontWeight = FontWeight.SemiBold,
                                                )
                                                Text(
                                                    stock.article,
                                                    style = MaterialTheme.typography.labelSmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                )
                                            }
                                            Column(horizontalAlignment = Alignment.End) {
                                                Text(
                                                    "${numberFormat.format(stock.currentQuantity)} ${unitLabel(stock.unit)}",
                                                    fontWeight = FontWeight.Bold,
                                                )
                                                Text(
                                                    if (stock.belowMinimum) "ниже минимума" else "в норме",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = if (stock.belowMinimum) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary,
                                                )
                                                if (stock.expectedQuantity > 0) {
                                                    Text(
                                                        "+${numberFormat.format(stock.expectedQuantity)} ${unitLabel(stock.unit)} в пути",
                                                        style = MaterialTheme.typography.labelSmall,
                                                        color = MaterialTheme.colorScheme.primary,
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private data class MovementLine(
    val material: MaterialItem,
    val quantity: Double,
)

@Composable
private fun HierarchyMaterialPicker(
    categories: List<CategoryItem>,
    materials: List<MaterialItem>,
    selectedCategoryId: String,
    selectedMaterialName: String,
    selectedMaterialId: String,
    onCategorySelected: (String) -> Unit,
    onMaterialSelected: (String) -> Unit,
    onWidthSelected: (String) -> Unit,
    excludeOracal: Boolean = false,
) {
    val availableMaterials = materials.filter { material ->
        !excludeOracal || material.kind != "Oracal641"
    }
    val availableCategories = categories.filter { category ->
        availableMaterials.any { material -> material.categoryId == category.id }
    }
    val categoryMaterials = availableMaterials.filter {
        it.categoryId == selectedCategoryId
    }
    val materialGroups = categoryMaterials
        .groupBy(::materialBaseName)
        .entries
        .toList()
    val widthMaterials = materialGroups
        .firstOrNull { it.key == selectedMaterialName }
        ?.value
        .orEmpty()
        .sortedWith(compareBy<MaterialItem> {
            if (it.kind == "Ink") inkColorOrder(it.colorName) else 0
        }.thenByDescending { it.widthMeters ?: 0.0 }.thenBy { it.packageLiters ?: 0.0 })
    val inkCategory = categoryMaterials.firstOrNull()?.kind == "Ink"

    SelectionDropdown(
        label = "Категория",
        value = availableCategories.firstOrNull { it.id == selectedCategoryId }?.name.orEmpty(),
        placeholder = "Выберите категорию",
        options = availableCategories.map { it.id to it.name },
        onSelect = onCategorySelected,
    )

    SelectionDropdown(
        label = if (inkCategory) "Станок" else "Материал",
        value = selectedMaterialName,
        placeholder = if (selectedCategoryId.isBlank()) "Сначала выберите категорию" else if (inkCategory) "Выберите станок" else "Выберите материал",
        options = materialGroups.map { it.key to it.key },
        enabled = selectedCategoryId.isNotBlank(),
        onSelect = onMaterialSelected,
    )

    SelectionDropdown(
        label = if (inkCategory) "Цвет" else "Ширина",
        value = widthMaterials.firstOrNull { it.id == selectedMaterialId }
            ?.let(::materialDisplayName)
            .orEmpty(),
        placeholder = if (selectedMaterialName.isBlank()) {
            if (inkCategory) "Сначала выберите станок" else "Сначала выберите материал"
        } else if (inkCategory) "Выберите цвет" else "Выберите ширину",
        options = widthMaterials.map { material ->
            material.id to (if (material.kind == "Ink") {
                "${material.colorName ?: "Без цвета"} · ${numberFormat.format(material.packageLiters ?: 0.0)} л · "
            } else {
                "${material.widthMeters?.let { "${numberFormat.format(it)} м" } ?: "Без ширины"} · "
            }) +
                filmMarkerText(material.categoryName).let { if (it.isBlank()) "" else "$it · " } +
                "остаток ${numberFormat.format(material.currentQuantity)} ${unitLabel(material.unit)}"
        },
        enabled = selectedMaterialName.isNotBlank(),
        onSelect = onWidthSelected,
    )
}

@Composable
private fun SelectionDropdown(
    label: String,
    value: String,
    placeholder: String,
    options: List<Pair<String, String>>,
    enabled: Boolean = true,
    onSelect: (String) -> Unit,
) {
    var expanded by remember { mutableStateOf(false) }

    Column(verticalArrangement = Arrangement.spacedBy(5.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Box(Modifier.fillMaxWidth()) {
            OutlinedButton(
                onClick = { expanded = true },
                enabled = enabled && options.isNotEmpty(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(
                    value.ifBlank { placeholder },
                    modifier = Modifier.weight(1f),
                    maxLines = 2,
                )
                Text("⌄")
            }
            DropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false },
                modifier = Modifier.fillMaxWidth().heightIn(max = 320.dp),
            ) {
                options.forEach { (id, optionLabel) ->
                    DropdownMenuItem(
                        text = { Text(optionLabel) },
                        onClick = {
                            expanded = false
                            onSelect(id)
                        },
                    )
                }
            }
        }
    }
}

@Composable
fun MovementScreen(api: ApiService, type: String) {
    val receiving = type == "Receiving"
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var materials by remember { mutableStateOf<List<MaterialItem>>(emptyList()) }
    var categories by remember { mutableStateOf<List<CategoryItem>>(emptyList()) }
    var selectedCategoryId by remember { mutableStateOf("") }
    var selectedMaterialName by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<MaterialItem?>(null) }
    var quantity by remember { mutableStateOf("1") }
    var supplier by remember { mutableStateOf("") }
    var externalNumber by remember { mutableStateOf("") }
    var recipient by remember { mutableStateOf("") }
    var documentDate by remember { mutableStateOf(LocalDate.now().toString()) }
    var comment by remember { mutableStateOf("") }
    var recentIssues by remember { mutableStateOf<List<WarehouseDocumentResponse>>(emptyList()) }
    val lines = remember { mutableStateListOf<MovementLine>() }
    var loading by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            val loadedMaterials = api.loadAllMaterials().filter { it.isActive }
            val loadedCategories = api.getCategories().filter { it.isActive }
            materials = loadedMaterials
            categories = loadedCategories.filter { category ->
                loadedMaterials.any { material -> material.categoryId == category.id }
            }
            if (!receiving) {
                recentIssues = api.getWarehouseDocuments()
                    .filter { it.type == "Issue" && it.status == "Posted" }
                    .sortedByDescending { it.postedAtUtc ?: it.createdAtUtc }
                    .take(3)
            }
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    val selectableMaterials = materials.filter { material ->
        !lines.any { it.material.id == material.id }
    }

    Column(
        modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader(
            if (receiving) "Новый приход" else "Новый расход",
            "Документ будет создан и сразу проведён",
            onRefresh = { refreshKey += 1 },
        )

        if (loading) LoadingBlock()
        if (error.isNotBlank()) ErrorBlock(error)
        if (success.isNotBlank()) SuccessBlock(success)

        if (!receiving && recentIssues.isNotEmpty()) {
            Text("Последние расходы", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            recentIssues.forEach { document ->
                SurfaceRow {
                    Column(Modifier.weight(1f)) {
                        Text(document.number, fontWeight = FontWeight.SemiBold)
                        Text(
                            document.recipient?.takeIf { it.isNotBlank() } ?: "Получатель не указан",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text("${document.items.size} поз.")
                }
            }
        }

        if (receiving) {
            OutlinedButton(
                onClick = {
                    val initial = runCatching { LocalDate.parse(documentDate) }.getOrDefault(LocalDate.now())
                    DatePickerDialog(
                        context,
                        { _, year, month, day ->
                            documentDate = "%04d-%02d-%02d".format(year, month + 1, day)
                        },
                        initial.year,
                        initial.monthValue - 1,
                        initial.dayOfMonth,
                    ).show()
                },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Дата накладной: ${documentDate.split('-').reversed().joinToString(".")}")
            }
            OutlinedTextField(
                value = supplier,
                onValueChange = { supplier = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Поставщик") },
                singleLine = true,
            )
            OutlinedTextField(
                value = externalNumber,
                onValueChange = { externalNumber = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Номер накладной") },
                singleLine = true,
            )
        } else {
            OutlinedTextField(
                value = recipient,
                onValueChange = { recipient = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Получатель / объект") },
                singleLine = true,
            )
        }

        HierarchyMaterialPicker(
            categories = categories,
            materials = selectableMaterials,
            selectedCategoryId = selectedCategoryId,
            selectedMaterialName = selectedMaterialName,
            selectedMaterialId = selected?.id.orEmpty(),
            onCategorySelected = { categoryId ->
                selectedCategoryId = categoryId
                selectedMaterialName = ""
                selected = null
            },
            onMaterialSelected = { materialName ->
                selectedMaterialName = materialName
                selected = null
            },
            onWidthSelected = { materialId ->
                selected = selectableMaterials.firstOrNull { it.id == materialId }
            },
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedTextField(
                value = quantity,
                onValueChange = { quantity = normalizeNumericInput(it) },
                modifier = Modifier.weight(1f),
                label = { Text("Количество") },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                singleLine = true,
            )
            Button(
                onClick = {
                    val material = selected ?: return@Button
                    val amount = parseNumber(quantity)
                    if (amount == null || amount <= 0) {
                        error = "Количество должно быть больше нуля."
                        return@Button
                    }
                    if (material.kind == "Standard" && amount % 1.0 != 0.0) {
                        error = "Стандартные материалы учитываются целыми штуками."
                        return@Button
                    }
                    val normalizedAmount = roundToStep(
                        amount,
                        when (material.kind) {
                            "Oracal641" -> 0.01
                            "Ink" -> 0.1
                            else -> 1.0
                        },
                    )
                    if (!receiving && normalizedAmount > material.currentQuantity) {
                        error = "Нельзя списать больше текущего остатка."
                        return@Button
                    }
                    lines += MovementLine(material, normalizedAmount)
                    selected = null
                    selectedMaterialName = ""
                    quantity = "1"
                    error = ""
                },
                enabled = selected != null,
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
            }
        }

        if (lines.isNotEmpty()) {
            Text("Позиции", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            lines.forEach { line ->
                SurfaceRow {
                    Column(Modifier.weight(1f)) {
                        Text(materialDisplayName(line.material), fontWeight = FontWeight.SemiBold)
                        Text(line.material.article, style = MaterialTheme.typography.bodySmall)
                    }
                    Text("${numberFormat.format(line.quantity)} ${unitLabel(line.material.unit)}")
                    Spacer(Modifier.width(8.dp))
                    OutlinedButton(onClick = { lines.remove(line) }) { Text("×") }
                }
            }
        }

        OutlinedTextField(
            value = comment,
            onValueChange = { comment = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Комментарий") },
        )

        Button(
            onClick = {
                if (lines.isEmpty()) {
                    error = "Добавьте хотя бы одну позицию."
                    return@Button
                }

                scope.launch {
                    try {
                        busy = true
                        error = ""
                        success = ""

                        val draft = api.createWarehouseDocument(
                            WarehouseDocumentCreateRequest(
                                type = type,
                                documentDate = documentDate,
                                supplier = supplier.trim().takeIf { it.isNotBlank() },
                                externalNumber = externalNumber.trim().takeIf { it.isNotBlank() },
                                recipient = recipient.trim().takeIf { it.isNotBlank() },
                                comment = comment.trim().takeIf { it.isNotBlank() },
                                items = lines.map {
                                    WarehouseDocumentCreateItem(it.material.id, it.quantity)
                                },
                            ),
                        )
                        val posted = api.postWarehouseDocument(draft.id)
                        success = "Документ ${posted.number} проведён."
                        lines.clear()
                        supplier = ""
                        externalNumber = ""
                        recipient = ""
                        documentDate = LocalDate.now().toString()
                        comment = ""
                        refreshKey += 1
                    } catch (requestError: Throwable) {
                        error = ApiClient.errorMessage(requestError)
                    } finally {
                        busy = false
                    }
                }
            },
            enabled = !busy && lines.isNotEmpty(),
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (busy) {
                CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            }
            Text(if (busy) "Проведение..." else if (receiving) "Провести приход" else "Провести расход")
        }
    }
}

data class NavigationOption(
    val title: String,
    val icon: ImageVector,
)

@Composable
fun MoreScreen(
    fullName: String,
    role: String,
    screens: List<NavigationOption>,
    onSelect: (String) -> Unit,
    onLogout: () -> Unit,
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(fullName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(
                        if (role == "Administrator") "Администратор" else "Сотрудник",
                        color = MaterialTheme.colorScheme.primary,
                    )
                }
            }
        }

        items(screens, key = { it.title }) { screen ->
            Card(
                modifier = Modifier.fillMaxWidth().clickable { onSelect(screen.title) },
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Icon(screen.icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                    Spacer(Modifier.width(12.dp))
                    Text(screen.title, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                    Text("›", style = MaterialTheme.typography.titleLarge)
                }
            }
        }

        item {
            OutlinedButton(onClick = onLogout, modifier = Modifier.fillMaxWidth()) {
                Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Выйти из профиля")
            }
        }
    }
}

@Composable
fun NotificationsScreen(api: ApiService, onUnreadChanged: (Int) -> Unit) {
    val scope = rememberCoroutineScope()
    var notifications by remember { mutableStateOf<List<NotificationItem>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            error = ""
            val response = api.getNotifications()
            notifications = response.items
            onUnreadChanged(response.unreadCount)
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    Column(Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
        SectionHeader("Уведомления", "Низкие остатки и сроки поставок", onRefresh = { refreshKey += 1 })
        if (loading) LoadingBlock()
        if (error.isNotBlank()) ErrorBlock(error)
        if (!loading && notifications.isEmpty()) SuccessBlock("Новых уведомлений нет.")

        LazyColumn(Modifier.fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(notifications, key = { it.id }) { notification ->
                Card(
                    modifier = Modifier.fillMaxWidth().clickable {
                        if (notification.readAtUtc == null) {
                            scope.launch {
                                runCatching { api.markNotificationRead(notification.id) }
                                    .onSuccess { refreshKey += 1 }
                            }
                        }
                    },
                    colors = CardDefaults.cardColors(
                        containerColor = if (notification.readAtUtc == null) {
                            MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
                        } else {
                            MaterialTheme.colorScheme.surface
                        },
                    ),
                ) {
                    Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
                        Text(notification.title, fontWeight = FontWeight.Bold)
                        Text(notification.message)
                        Text(
                            formatDate(notification.createdAtUtc),
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }
    }
}

private data class SupplyDraftLine(
    val material: MaterialItem,
    val quantity: Double,
)

@Composable
fun SuppliesScreen(api: ApiService) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    var supplies by remember { mutableStateOf<List<SupplyInvoiceResponse>>(emptyList()) }
    var materials by remember { mutableStateOf<List<MaterialItem>>(emptyList()) }
    var categories by remember { mutableStateOf<List<CategoryItem>>(emptyList()) }
    val lines = remember { mutableStateListOf<SupplyDraftLine>() }
    var formOpen by remember { mutableStateOf(false) }
    var supplier by remember { mutableStateOf("") }
    var invoiceNumber by remember { mutableStateOf("") }
    var invoiceDate by remember { mutableStateOf(LocalDate.now().toString()) }
    var amount by remember { mutableStateOf("0") }
    var paymentDueDate by remember { mutableStateOf("") }
    var expectedDeliveryDate by remember { mutableStateOf("") }
    var comment by remember { mutableStateOf("") }
    var selectedCategoryId by remember { mutableStateOf("") }
    var selectedMaterialName by remember { mutableStateOf("") }
    var selectedMaterialId by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf("1") }
    var loading by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }
    var expandedSupplyId by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            error = ""
            supplies = api.getSupplies()
            materials = api.loadAllMaterials().filter {
                it.isActive && it.kind != "Oracal641"
            }
            categories = api.getCategories().filter { category ->
                category.isActive && materials.any { material -> material.categoryId == category.id }
            }
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    LazyColumn(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        item {
            SectionHeader("Поставки", "Счета, сроки и ожидаемые материалы", onRefresh = { refreshKey += 1 })
        }
        item {
            Button(
                onClick = { formOpen = !formOpen; error = ""; success = "" },
                modifier = Modifier.fillMaxWidth(),
            ) {
                Icon(Icons.Default.Add, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(if (formOpen) "Закрыть форму" else "Добавить счёт")
            }
        }
        if (error.isNotBlank()) item { ErrorBlock(error) }
        if (success.isNotBlank()) item { SuccessBlock(success) }
        if (loading) item { LoadingBlock() }

        if (formOpen) {
            item {
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        Text("Новый счёт", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        OutlinedTextField(supplier, { supplier = it }, Modifier.fillMaxWidth(), label = { Text("Поставщик") }, singleLine = true)
                        OutlinedTextField(invoiceNumber, { invoiceNumber = it }, Modifier.fillMaxWidth(), label = { Text("Номер счёта") }, singleLine = true)
                        DateButton("Дата счёта", invoiceDate, context) { invoiceDate = it }
                        OutlinedTextField(
                            amount,
                            { amount = normalizeNumericInput(it) },
                            Modifier.fillMaxWidth(),
                            label = { Text("Сумма") },
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                            singleLine = true,
                        )
                        DateButton("Оплатить до", paymentDueDate, context, allowEmpty = true) { paymentDueDate = it }
                        DateButton("Ожидаемая поставка", expectedDeliveryDate, context, allowEmpty = true) { expectedDeliveryDate = it }

                        Text("Материалы", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                        HierarchyMaterialPicker(
                            categories = categories,
                            materials = materials.filter { material -> lines.none { it.material.id == material.id } },
                            selectedCategoryId = selectedCategoryId,
                            selectedMaterialName = selectedMaterialName,
                            selectedMaterialId = selectedMaterialId,
                            onCategorySelected = { selectedCategoryId = it; selectedMaterialName = ""; selectedMaterialId = "" },
                            onMaterialSelected = { selectedMaterialName = it; selectedMaterialId = "" },
                            onWidthSelected = { selectedMaterialId = it },
                            excludeOracal = true,
                        )
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            OutlinedTextField(
                                quantity,
                                { quantity = normalizeNumericInput(it) },
                                Modifier.weight(1f),
                                label = { Text("Количество") },
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                                singleLine = true,
                            )
                            Button(onClick = {
                                val material = materials.firstOrNull { it.id == selectedMaterialId }
                                val value = parseNumber(quantity)
                                if (material == null || value == null || value <= 0) {
                                    error = "Выберите материал и укажите количество."
                                } else if (value % 1.0 != 0.0) {
                                    error = "Количество обычного материала должно быть целым."
                                } else {
                                    lines += SupplyDraftLine(
                                        material,
                                        roundToStep(value, if (material.kind == "Ink") 0.1 else 1.0),
                                    )
                                    selectedMaterialName = ""
                                    selectedMaterialId = ""
                                    quantity = "1"
                                    error = ""
                                }
                            }) {
                                Icon(Icons.Default.Add, contentDescription = null)
                            }
                        }

                        lines.forEach { line ->
                            SurfaceRow {
                                Column(Modifier.weight(1f)) {
                                    Text(materialDisplayName(line.material), fontWeight = FontWeight.SemiBold)
                                    Text(line.material.article, style = MaterialTheme.typography.bodySmall)
                                }
                                Text("${numberFormat.format(line.quantity)} ${unitLabel(line.material.unit)}")
                                IconButton(onClick = { lines.remove(line) }) {
                                    Icon(Icons.Default.Remove, contentDescription = "Удалить")
                                }
                            }
                        }

                        OutlinedTextField(comment, { comment = it }, Modifier.fillMaxWidth(), label = { Text("Комментарий") }, maxLines = 3)
                        Button(
                            onClick = {
                                val invoiceAmount = parseNumber(amount)
                                if (supplier.isBlank() || invoiceNumber.isBlank() || invoiceAmount == null || invoiceAmount < 0 || lines.isEmpty()) {
                                    error = "Укажите поставщика, номер, сумму и хотя бы один материал."
                                    return@Button
                                }
                                scope.launch {
                                    try {
                                        busy = true
                                        error = ""
                                        val created = api.createSupply(
                                            SupplyInvoiceUpsertRequest(
                                                supplier = supplier.trim(),
                                                invoiceNumber = invoiceNumber.trim(),
                                                invoiceDate = invoiceDate,
                                                amount = invoiceAmount,
                                                paymentDueDate = paymentDueDate.ifBlank { null },
                                                expectedDeliveryDate = expectedDeliveryDate.ifBlank { null },
                                                comment = comment.trim().ifBlank { null },
                                                items = lines.map { SupplyInvoiceUpsertItem(it.material.id, it.quantity) },
                                            ),
                                        )
                                        success = "Счёт ${created.invoiceNumber} добавлен."
                                        formOpen = false
                                        supplier = ""; invoiceNumber = ""; invoiceDate = LocalDate.now().toString()
                                        amount = "0"; paymentDueDate = ""; expectedDeliveryDate = ""; comment = ""
                                        selectedCategoryId = ""; selectedMaterialName = ""; selectedMaterialId = ""; lines.clear()
                                        refreshKey += 1
                                    } catch (requestError: Throwable) {
                                        error = ApiClient.errorMessage(requestError)
                                    } finally {
                                        busy = false
                                    }
                                }
                            },
                            enabled = !busy,
                            modifier = Modifier.fillMaxWidth(),
                        ) {
                            Text(if (busy) "Сохранение..." else "Сохранить счёт")
                        }
                    }
                }
            }
        }

        if (!loading && supplies.isEmpty()) item { SuccessBlock("Активных поставок нет.") }
        items(supplies, key = { it.id }) { supply ->
            SupplyCard(
                supply = supply,
                materialById = materials.associateBy { it.id },
                expanded = expandedSupplyId == supply.id,
                onToggle = {
                    expandedSupplyId = if (expandedSupplyId == supply.id) null else supply.id
                },
            )
        }
    }
}

@Composable
private fun SupplyCard(
    supply: SupplyInvoiceResponse,
    materialById: Map<String, MaterialItem>,
    expanded: Boolean,
    onToggle: () -> Unit,
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onToggle),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(
            1.dp,
            if (expanded) MaterialTheme.colorScheme.primary.copy(alpha = 0.45f)
            else MaterialTheme.colorScheme.surfaceVariant,
        ),
    ) {
        Column(Modifier.fillMaxWidth().padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(Modifier.weight(1f)) {
                    Text(supply.supplier, fontWeight = FontWeight.Bold)
                    Text(
                        "Счёт ${supply.invoiceNumber} от ${supply.invoiceDate.split('-').reversed().joinToString(".")}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(supplyStatusLabel(supply.status), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
                    Icon(
                        if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                        contentDescription = if (expanded) "Свернуть" else "Открыть подробно",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }
            Text("Сумма: ${numberFormat.format(supply.amount)} ₽")
            supply.expectedDeliveryDate?.let {
                Text("Ожидается: ${it.split('-').reversed().joinToString(".")}", style = MaterialTheme.typography.bodySmall)
            }
            val remaining = supply.items.sumOf { it.remainingQuantity }
            Text(
                "Позиций: ${supply.items.size} · осталось принять: ${numberFormat.format(remaining)}",
                style = MaterialTheme.typography.bodySmall,
            )
            if (!expanded) {
                Text(
                    "Нажмите, чтобы посмотреть состав поставки",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.primary,
                )
            } else {
                HorizontalDivider(Modifier.padding(vertical = 7.dp))
                supply.paymentDueDate?.let {
                    Text("Оплатить до: ${formatShortDate(it)}", style = MaterialTheme.typography.bodySmall)
                }
                supply.comment?.takeIf { it.isNotBlank() }?.let {
                    Text("Комментарий: $it", style = MaterialTheme.typography.bodySmall)
                }
                Text("Материалы", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 4.dp))
                if (supply.items.isEmpty()) {
                    Text("Материалы не указаны", color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                supply.items.forEachIndexed { index, item ->
                    if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f))
                    val material = materialById[item.materialId]
                    Column(Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                        Text(
                            material?.let(::materialDisplayName) ?: "Материал из архива",
                            fontWeight = FontWeight.SemiBold,
                        )
                        material?.article?.let {
                            Text(it, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(
                                "Ожидалось: ${numberFormat.format(item.expectedQuantity)} ${unitLabel(material?.unit.orEmpty())}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                            Text(
                                "Получено: ${numberFormat.format(item.receivedQuantity)}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                        }
                        Text(
                            "Осталось: ${numberFormat.format(item.remainingQuantity)} ${unitLabel(material?.unit.orEmpty())}",
                            style = MaterialTheme.typography.bodySmall,
                            color = if (item.remainingQuantity > 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondary,
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun SettingsScreen(api: ApiService, initialTheme: String, onThemeChange: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var selectedTheme by remember(initialTheme) { mutableStateOf(initialTheme) }
    var message by remember { mutableStateOf("") }
    val themes = listOf("System" to "Как в системе", "Light" to "Светлая", "Dark" to "Тёмная")

    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader("Настройки", "Персональные параметры приложения")
        Text("Тема", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        themes.forEach { (value, label) ->
            Card(
                modifier = Modifier.fillMaxWidth().clickable {
                    selectedTheme = value
                    onThemeChange(value)
                    scope.launch {
                        runCatching { api.updatePreferences(UpdatePreferencesRequest(theme = value)) }
                            .onSuccess { message = "Тема сохранена." }
                            .onFailure { message = ApiClient.errorMessage(it) }
                    }
                },
                border = BorderStroke(
                    1.dp,
                    if (selectedTheme == value) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant,
                ),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            ) {
                Row(Modifier.fillMaxWidth().padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Text(label, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                    Text(if (selectedTheme == value) "●" else "○", color = MaterialTheme.colorScheme.primary)
                }
            }
        }
        if (message.isNotBlank()) Text(message, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun InventoryScreen(api: ApiService, oracal: Boolean) {
    val scope = rememberCoroutineScope()
    var materials by remember { mutableStateOf<List<MaterialItem>>(emptyList()) }
    var categories by remember { mutableStateOf<List<CategoryItem>>(emptyList()) }
    val counts = remember { mutableStateMapOf<String, String>() }
    var selectedMaterialId by remember { mutableStateOf<String?>(null) }
    var comment by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var orderMode by remember { mutableStateOf(false) }
    var savingOrder by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey, oracal) {
        try {
            loading = true
            error = ""
            val loadedMaterials = api.loadAllMaterials().filter {
                it.isActive && (!oracal || it.kind == "Oracal641")
            }
            materials = loadedMaterials
            categories = api.getCategories().filter { category ->
                category.isActive && loadedMaterials.any { material -> material.categoryId == category.id }
            }
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    val grouped = categories.mapNotNull { category ->
        val categoryMaterials = materials.filter { it.categoryId == category.id }
        if (categoryMaterials.isEmpty()) null
        else category to categoryMaterials.groupBy(::materialBaseName)
    }

    fun moveInventoryMaterial(categoryId: String, materialName: String, direction: Int) {
        if (!orderMode || savingOrder) return
        val categoryMaterials = materials.filter { it.categoryId == categoryId }
        val materialGroups = categoryMaterials.groupBy(::materialBaseName).entries.toMutableList()
        val from = materialGroups.indexOfFirst { it.key == materialName }
        if (from < 0) return
        val to = (from + direction).coerceIn(0, materialGroups.lastIndex)
        if (from == to) return
        val moved = materialGroups.removeAt(from)
        materialGroups.add(to, moved)

        val reorderedCategory = materialGroups.flatMap { entry ->
            entry.value.sortedByDescending { it.widthMeters ?: 0.0 }
        }
        val firstCategoryIndex = materials.indexOfFirst { it.categoryId == categoryId }
        val next = materials.filterNot { it.categoryId == categoryId }.toMutableList()
        next.addAll(firstCategoryIndex.coerceAtLeast(0).coerceAtMost(next.size), reorderedCategory)
        materials = next

        scope.launch {
            try {
                savingOrder = true
                error = ""
                api.updatePreferences(UpdatePreferencesRequest(materialOrder = next.map { it.id }))
            } catch (requestError: Throwable) {
                error = ApiClient.errorMessage(requestError)
                refreshKey += 1
            } finally {
                savingOrder = false
            }
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader(
            if (oracal) "Инвентаризация ORACAL" else "Инвентаризация склада",
            if (oracal) "Подсчёт ORACAL с шагом 0,01 м."
            else "Обычные материалы, краска и ORACAL можно считать в одном документе.",
            onRefresh = { counts.clear(); selectedMaterialId = null; refreshKey += 1 },
        )

        OutlinedButton(
            onClick = {
                orderMode = !orderMode
                selectedMaterialId = null
            },
            enabled = !savingOrder,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(
                if (orderMode) Icons.Default.Lock else Icons.Default.LockOpen,
                contentDescription = null,
            )
            Spacer(Modifier.width(8.dp))
            Text(
                when {
                    savingOrder -> "Сохранение..."
                    orderMode -> "Завершить порядок"
                    else -> "Изменить порядок материалов"
                },
            )
        }

        Text(
            if (orderMode)
                "Перемещение включено. Используйте стрелки у названия материала."
            else
                "Порядок защищён от случайного изменения.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        if (error.isNotBlank()) ErrorBlock(error)
        if (success.isNotBlank()) SuccessBlock(success)
        if (loading) LoadingBlock()

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            grouped.forEach { (category, materialGroups) ->
                item(key = "inventory-category-${category.id}") {
                    Text(
                        category.name,
                        modifier = Modifier.padding(top = 8.dp),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }

                materialGroups.entries.forEachIndexed { materialIndex, (materialName, widths) ->
                    item(key = "inventory-group-${category.id}-$materialName") {
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            border = BorderStroke(
                                1.dp,
                                MaterialTheme.colorScheme.primary.copy(alpha = 0.22f),
                            ),
                        ) {
                            Column(Modifier.fillMaxWidth().padding(10.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(horizontal = 4.dp, vertical = 5.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Column(Modifier.weight(1f)) {
                                        Text(materialName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                                        filmDescription(category.name).takeIf { it.isNotBlank() }?.let { film ->
                                            Text(
                                                film,
                                                style = MaterialTheme.typography.bodySmall,
                                                color = MaterialTheme.colorScheme.primary,
                                            )
                                        }
                                    }
                                    if (orderMode) {
                                        IconButton(
                                            onClick = { moveInventoryMaterial(category.id, materialName, -1) },
                                            enabled = materialIndex > 0,
                                        ) { Text("↑", fontWeight = FontWeight.Bold) }
                                        IconButton(
                                            onClick = { moveInventoryMaterial(category.id, materialName, 1) },
                                            enabled = materialIndex < materialGroups.size - 1,
                                        ) { Text("↓", fontWeight = FontWeight.Bold) }
                                    }
                                }
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(horizontal = 5.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically,
                                ) {
                                    Text(
                                        if (widths.firstOrNull()?.kind == "Ink") "ЦВЕТ" else "ШИРИНА",
                                        modifier = Modifier.weight(1f),
                                        style = MaterialTheme.typography.titleSmall,
                                        fontWeight = FontWeight.Bold,
                                    )
                                    Text(
                                        "ПО СИСТЕМЕ",
                                        modifier = Modifier.width(72.dp),
                                        textAlign = TextAlign.Center,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                    Text(
                                        "ПО ФАКТУ",
                                        modifier = Modifier.width(130.dp),
                                        textAlign = TextAlign.Center,
                                        style = MaterialTheme.typography.labelSmall,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }

                                widths.sortedByDescending { it.widthMeters ?: 0.0 }.forEach { material ->
                                    val selected = selectedMaterialId == material.id
                                    val actual = parseNumber(counts[material.id].orEmpty())
                                    val displayActual = actual ?: 0.0
                                    val quantityStep = when (material.kind) {
                                        "Oracal641" -> 0.01
                                        "Ink" -> 0.1
                                        else -> 1.0
                                    }

                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(
                                                if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
                                                else Color.Transparent,
                                                RoundedCornerShape(9.dp),
                                            )
                                            .clickable(enabled = !orderMode) {
                                                selectedMaterialId = material.id
                                                if (counts[material.id].isNullOrBlank()) {
                                                    counts[material.id] = "0"
                                                }
                                            }
                                            .padding(horizontal = 5.dp, vertical = 6.dp),
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Row(
                                                modifier = Modifier.weight(1f),
                                                verticalAlignment = Alignment.CenterVertically,
                                            ) {
                                                if ((material.kind == "Oracal641" || material.kind == "Ink") && !material.colorHex.isNullOrBlank()) {
                                                    Box(
                                                        Modifier.size(18.dp).background(
                                                            parseHexColor(material.colorHex),
                                                            RoundedCornerShape(5.dp),
                                                        ),
                                                    )
                                                    Spacer(Modifier.width(6.dp))
                                                }
                                                Column {
                                                    Text(
                                                        if (material.kind == "Ink") {
                                                            "${material.colorName ?: "Без цвета"} · ${numberFormat.format(material.packageLiters ?: 0.0)} л"
                                                        } else {
                                                            material.widthMeters?.let { "${numberFormat.format(it)} м" } ?: "—"
                                                        },
                                                        style = MaterialTheme.typography.titleMedium,
                                                        fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                                    )
                                                    filmDescription(category.name).takeIf { it.isNotBlank() }?.let { film ->
                                                        Text(
                                                            film,
                                                            style = MaterialTheme.typography.labelSmall,
                                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                        )
                                                    }
                                                }
                                            }
                                            Text(
                                                numberFormat.format(material.currentQuantity),
                                                modifier = Modifier.width(72.dp),
                                                textAlign = TextAlign.Center,
                                                fontWeight = FontWeight.Bold,
                                            )
                                            Row(
                                                modifier = Modifier.width(130.dp),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween,
                                            ) {
                                                OutlinedButton(
                                                    onClick = {
                                                        counts[material.id] = numberFormat.format(
                                                            roundToStep(
                                                                (displayActual - quantityStep).coerceAtLeast(0.0),
                                                                quantityStep,
                                                            ),
                                                        )
                                                    },
                                                    enabled = selected && displayActual > 0,
                                                    modifier = Modifier.size(38.dp),
                                                ) { Text("−", style = MaterialTheme.typography.titleMedium) }
                                                Text(
                                                    numberFormat.format(displayActual),
                                                    modifier = Modifier.width(48.dp),
                                                    textAlign = TextAlign.Center,
                                                    style = MaterialTheme.typography.titleMedium,
                                                    fontWeight = FontWeight.Bold,
                                                )
                                                OutlinedButton(
                                                    onClick = {
                                                        counts[material.id] = numberFormat.format(
                                                            roundToStep(displayActual + quantityStep, quantityStep),
                                                        )
                                                    },
                                                    enabled = selected,
                                                    modifier = Modifier.size(38.dp),
                                                ) { Text("+", style = MaterialTheme.typography.titleMedium) }
                                            }
                                        }
                                        Row(
                                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                                            horizontalArrangement = Arrangement.End,
                                        ) {
                                            Text(
                                                "мин. ${numberFormat.format(material.minimumQuantity)} · " +
                                                    (if (material.belowMinimum) "ниже минимума" else "в норме") +
                                                    (if (material.expectedQuantity > 0) " · +${numberFormat.format(material.expectedQuantity)} в пути" else ""),
                                                style = MaterialTheme.typography.labelSmall,
                                                color = if (material.belowMinimum) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant,
                                            )
                                        }
                                    }
                                    HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                                }
                            }
                        }
                    }
                }
            }
        }

        OutlinedTextField(
            value = comment,
            onValueChange = { comment = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Комментарий") },
            maxLines = 2,
        )

        Button(
            onClick = {
                val entered = counts.filterValues { it.isNotBlank() }
                if (entered.isEmpty()) {
                    error = "Посчитайте хотя бы одну позицию."
                    return@Button
                }

                val inventoryItems = mutableListOf<InventoryDocumentCreateItem>()

                for ((materialId, value) in entered) {
                    val actual = parseNumber(value)
                    val material = materials.firstOrNull { it.id == materialId }

                    if (actual == null || actual < 0 || material == null) {
                        error = "Проверьте введённые количества."
                        return@Button
                    }

                    if (material.kind == "Standard" && actual % 1.0 != 0.0) {
                        error = "Стандартные материалы учитываются целыми штуками."
                        return@Button
                    }

                    inventoryItems += InventoryDocumentCreateItem(materialId, actual)
                }

                scope.launch {
                    try {
                        busy = true
                        error = ""
                        success = ""
                        val draft = api.createInventoryDocument(
                            InventoryDocumentCreateRequest(
                                comment = comment.trim().takeIf { it.isNotBlank() }
                                    ?: if (oracal) "Инвентаризация ORACAL" else "Инвентаризация склада",
                                items = inventoryItems,
                            ),
                        )
                        val posted = api.postInventoryDocument(draft.id)
                        success = "Инвентаризация ${posted.number} проведена."
                        counts.clear()
                        selectedMaterialId = null
                        comment = ""
                        refreshKey += 1
                    } catch (requestError: Throwable) {
                        error = ApiClient.errorMessage(requestError)
                    } finally {
                        busy = false
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            enabled = !busy,
        ) {
            if (busy) {
                CircularProgressIndicator(Modifier.size(18.dp), strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            }
            Text(if (busy) "Проведение..." else "Провести (${counts.count { it.value.isNotBlank() }})")
        }
    }
}

private data class DisplayDocument(
    val id: String,
    val number: String,
    val type: String,
    val status: String,
    val createdAtUtc: String,
    val itemCount: Int,
    val subtitle: String,
    val warehouse: WarehouseDocumentResponse? = null,
    val inventory: InventoryDocumentResponse? = null,
)

@Composable
fun DocumentsScreen(api: ApiService) {
    var documents by remember { mutableStateOf<List<DisplayDocument>>(emptyList()) }
    var materialById by remember { mutableStateOf<Map<String, MaterialItem>>(emptyMap()) }
    var expandedDocumentKey by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            error = ""
            val warehouse = api.getWarehouseDocuments()
            val inventory = api.getInventoryDocuments()
            materialById = api.loadAllMaterials().associateBy { it.id }

            documents = (
                warehouse.map { it.toDisplayDocument() } +
                    inventory.map { it.toDisplayDocument() }
                ).sortedByDescending { it.createdAtUtc }
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader("Документы", "Приход, расход и инвентаризация", onRefresh = { refreshKey += 1 })

        if (loading) LoadingBlock()
        if (error.isNotBlank()) ErrorBlock(error)

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(documents, key = { "${it.type}-${it.id}" }) { document ->
                val documentKey = "${document.type}-${document.id}"
                val expanded = expandedDocumentKey == documentKey
                Card(
                    modifier = Modifier.fillMaxWidth().clickable {
                        expandedDocumentKey = if (expanded) null else documentKey
                    },
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    border = BorderStroke(
                        1.dp,
                        if (expanded) MaterialTheme.colorScheme.primary.copy(alpha = 0.45f)
                        else MaterialTheme.colorScheme.surfaceVariant,
                    ),
                ) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(document.number, Modifier.weight(1f), fontWeight = FontWeight.Bold)
                            Column(horizontalAlignment = Alignment.End) {
                                Text(statusLabel(document.status), color = statusColor(document.status), fontWeight = FontWeight.SemiBold)
                                Icon(
                                    if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                                    contentDescription = if (expanded) "Свернуть" else "Открыть документ",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }
                        Text(
                            "${documentTypeLabel(document.type)} · ${formatDate(document.createdAtUtc)}",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            "${document.itemCount} позиций${if (document.subtitle.isNotBlank()) " · ${document.subtitle}" else ""}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                        if (!expanded) {
                            Text(
                                "Нажмите, чтобы посмотреть материалы",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        } else {
                            DocumentDetails(document, materialById)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DocumentDetails(
    document: DisplayDocument,
    materialById: Map<String, MaterialItem>,
) {
    HorizontalDivider(Modifier.padding(vertical = 7.dp))

    document.warehouse?.let { warehouse ->
        warehouse.supplier?.takeIf { it.isNotBlank() }?.let {
            Text("Поставщик: $it", style = MaterialTheme.typography.bodySmall)
        }
        warehouse.externalNumber?.takeIf { it.isNotBlank() }?.let {
            Text("Накладная: $it", style = MaterialTheme.typography.bodySmall)
        }
        warehouse.recipient?.takeIf { it.isNotBlank() }?.let {
            Text("Получатель: $it", style = MaterialTheme.typography.bodySmall)
        }
        warehouse.comment?.takeIf { it.isNotBlank() }?.let {
            Text("Комментарий: $it", style = MaterialTheme.typography.bodySmall)
        }
        Text("Материалы", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 5.dp))
        if (warehouse.items.isEmpty()) {
            Text("Материалы не указаны", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        warehouse.items.forEachIndexed { index, item ->
            if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f))
            val material = materialById[item.materialId]
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 9.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Column(Modifier.weight(1f)) {
                    Text(material?.let(::materialDisplayName) ?: "Материал из архива", fontWeight = FontWeight.SemiBold)
                    Text(
                        material?.article ?: item.materialId,
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    "${numberFormat.format(item.quantity)} ${unitLabel(material?.unit.orEmpty())}",
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }

    document.inventory?.let { inventory ->
        inventory.comment?.takeIf { it.isNotBlank() }?.let {
            Text("Комментарий: $it", style = MaterialTheme.typography.bodySmall)
        }
        Text("Материалы", fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 5.dp))
        if (inventory.items.isEmpty()) {
            Text("Материалы не указаны", color = MaterialTheme.colorScheme.onSurfaceVariant)
        }
        inventory.items.forEachIndexed { index, item ->
            if (index > 0) HorizontalDivider(color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.65f))
            val material = materialById[item.materialId]
            Column(Modifier.fillMaxWidth().padding(vertical = 9.dp)) {
                Text(
                    material?.let(::materialDisplayName) ?: item.materialName,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    item.article ?: material?.article ?: "—",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 6.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    InventoryDetailValue("По системе", item.expectedQuantity, item.unit)
                    InventoryDetailValue("По факту", item.actualQuantity, item.unit)
                    InventoryDetailValue(
                        "Разница",
                        item.difference,
                        item.unit,
                        color = when {
                            item.difference < 0 -> MaterialTheme.colorScheme.error
                            item.difference > 0 -> MaterialTheme.colorScheme.secondary
                            else -> MaterialTheme.colorScheme.onSurface
                        },
                    )
                }
            }
        }
    }
}

@Composable
private fun InventoryDetailValue(
    label: String,
    value: Double,
    unit: String,
    color: Color = MaterialTheme.colorScheme.onSurface,
) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(
            "${if (label == "Разница" && value > 0) "+" else ""}${numberFormat.format(value)} ${unitLabel(unit)}",
            fontWeight = FontWeight.Bold,
            color = color,
        )
    }
}

@Composable
fun OperationsScreen(api: ApiService) {
    var items by remember { mutableStateOf<List<OperationItem>>(emptyList()) }
    var page by remember { mutableStateOf(1) }
    var totalPages by remember { mutableStateOf(1) }
    var totalCount by remember { mutableStateOf(0) }
    var search by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(page, search, refreshKey) {
        try {
            loading = true
            error = ""
            val response = api.getOperations(
                page = page,
                pageSize = 100,
                search = search.trim().takeIf { it.isNotBlank() },
            )
            items = response.items
            totalPages = maxOf(response.totalPages, 1)
            totalCount = response.totalCount
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader("Журнал операций", "$totalCount записей", onRefresh = { refreshKey += 1 })
        OutlinedTextField(
            value = search,
            onValueChange = { search = it; page = 1 },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Материал, документ, пользователь") },
            singleLine = true,
        )

        if (error.isNotBlank()) ErrorBlock(error)

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (loading) {
                item { LoadingBlock() }
            } else {
                items(items, key = { it.id }) { operation ->
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                        Column(
                            modifier = Modifier.fillMaxWidth().padding(13.dp),
                            verticalArrangement = Arrangement.spacedBy(5.dp),
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(operation.materialName, Modifier.weight(1f), fontWeight = FontWeight.SemiBold)
                                Text(
                                    signed(operation.quantityChange, ""),
                                    color = if (operation.quantityChange < 0) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary,
                                    fontWeight = FontWeight.Bold,
                                )
                            }
                            Text(
                                "${operation.displayType} · ${formatDate(operation.createdAtUtc)}",
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                style = MaterialTheme.typography.bodySmall,
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween,
                            ) {
                                Column {
                                    Text("Было", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(
                                        numberFormat.format(operation.quantityBefore),
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                    )
                                }
                                Text("→", style = MaterialTheme.typography.headlineSmall, color = MaterialTheme.colorScheme.primary)
                                Column(horizontalAlignment = Alignment.End) {
                                    Text("Стало", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    Text(
                                        numberFormat.format(operation.quantityAfter),
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold,
                                    )
                                }
                            }
                            Text(
                                "${operation.userName}${operation.documentNumber?.let { " · $it" } ?: ""}",
                                style = MaterialTheme.typography.bodySmall,
                            )
                            operation.comment?.takeIf { it.isNotBlank() }?.let {
                                HorizontalDivider(Modifier.padding(vertical = 3.dp))
                                Text(it, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    }
                }
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            OutlinedButton(onClick = { if (page > 1) page -= 1 }, enabled = page > 1 && !loading) {
                Text("Назад")
            }
            Text("$page / $totalPages")
            OutlinedButton(onClick = { if (page < totalPages) page += 1 }, enabled = page < totalPages && !loading) {
                Text("Далее")
            }
        }
    }
}

@Composable
private fun SectionHeader(
    title: String,
    subtitle: String,
    onRefresh: (() -> Unit)? = null,
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column(Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(subtitle, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
        }
        if (onRefresh != null) {
            OutlinedButton(onClick = onRefresh) {
                Icon(Icons.Default.Refresh, contentDescription = null)
            }
        }
    }
}

@Composable
private fun DashboardMetricCard(
    label: String,
    hint: String,
    value: String,
    icon: ImageVector,
    tone: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = tone.copy(alpha = 0.10f)),
        border = BorderStroke(1.dp, tone.copy(alpha = 0.30f)),
    ) {
        Column(Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(5.dp)) {
            Box(
                Modifier.size(34.dp).background(tone.copy(alpha = 0.16f), RoundedCornerShape(10.dp)),
                contentAlignment = Alignment.Center,
            ) {
                Icon(icon, contentDescription = null, tint = tone, modifier = Modifier.size(20.dp))
            }
            Text(value, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Text(label, fontWeight = FontWeight.SemiBold)
            Text(hint, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.labelSmall)
        }
    }
}

@Composable
private fun DashboardPanel(
    title: String,
    subtitle: String,
    icon: ImageVector,
    actionLabel: String,
    onAction: () -> Unit,
    content: @Composable ColumnScope.() -> Unit,
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Column(Modifier.fillMaxWidth().padding(14.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.size(36.dp).background(
                        MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                        RoundedCornerShape(10.dp),
                    ),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(icon, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                }
                Spacer(Modifier.width(9.dp))
                Column(Modifier.weight(1f)) {
                    Text(title, fontWeight = FontWeight.Bold)
                    Text(subtitle, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
                OutlinedButton(onClick = onAction) {
                    Text(actionLabel, style = MaterialTheme.typography.labelSmall)
                }
            }
            HorizontalDivider(Modifier.padding(top = 12.dp))
            content()
        }
    }
}

@Composable
private fun SurfaceRow(
    modifier: Modifier = Modifier,
    content: @Composable RowScope.() -> Unit,
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.surfaceVariant),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            content = content,
        )
    }
}

@Composable
private fun LoadingBlock() {
    Row(
        modifier = Modifier.fillMaxWidth().padding(18.dp),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CircularProgressIndicator(Modifier.size(22.dp), strokeWidth = 2.dp)
        Spacer(Modifier.width(10.dp))
        Text("Загрузка...")
    }
}

@Composable
private fun ErrorBlock(message: String) {
    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.error.copy(alpha = 0.1f)),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.error.copy(alpha = 0.35f)),
    ) {
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.ErrorOutline, contentDescription = null, tint = MaterialTheme.colorScheme.error)
            Spacer(Modifier.width(8.dp))
            Text(message, color = MaterialTheme.colorScheme.error)
        }
    }
}

@Composable
private fun SuccessBlock(message: String) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondary.copy(alpha = 0.1f))) {
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.secondary)
            Spacer(Modifier.width(8.dp))
            Text(message, color = MaterialTheme.colorScheme.secondary)
        }
    }
}

private fun materialDisplayName(material: MaterialItem): String {
    if (material.kind == "Ink") {
        val pack = material.packageLiters?.let { " · ${numberFormat.format(it)} л" }.orEmpty()
        return "${material.machineName ?: "Без станка"} · ${material.colorName ?: material.name}$pack"
    }
    val width = material.widthMeters?.let { "${numberFormat.format(it)} м" }
    val baseName = if (width == null) material.name else material.name
        .replace(Regex("\\s+-?\\s*\\d+(?:[.,]\\d+)?\\s*м\\s*$", RegexOption.IGNORE_CASE), "")
        .trim()
    val color = if (material.kind == "Oracal641") {
        listOfNotNull(material.colorCode, material.colorName).joinToString(" ").trim()
    } else {
        ""
    }
    val name = if (color.isBlank() || baseName.contains(color, ignoreCase = true)) {
        baseName
    } else {
        "$baseName · $color"
    }
    val label = width?.let { "$name - $it" } ?: name
    val markers = filmMarkerText(material.categoryName)
    return if (markers.isBlank()) label else "$label · $markers"
}

private fun stockDisplayName(material: StockItem): String {
    if (material.kind == "Ink") {
        val pack = material.packageLiters?.let { " · ${numberFormat.format(it)} л" }.orEmpty()
        return "${material.machineName ?: "Без станка"} · ${material.colorName ?: material.materialName}$pack"
    }
    val width = material.widthMeters?.let { "${numberFormat.format(it)} м" }
    val baseName = if (width == null) material.materialName else material.materialName
        .replace(Regex("\\s+-?\\s*\\d+(?:[.,]\\d+)?\\s*м\\s*$", RegexOption.IGNORE_CASE), "")
        .trim()
    val color = if (material.kind == "Oracal641") {
        listOfNotNull(material.colorCode, material.colorName).joinToString(" ").trim()
    } else {
        ""
    }
    val name = if (color.isBlank() || baseName.contains(color, ignoreCase = true)) {
        baseName
    } else {
        "$baseName · $color"
    }
    val label = width?.let { "$name - $it" } ?: name
    val markers = filmMarkerText(material.categoryName)
    return if (markers.isBlank()) label else "$label · $markers"
}

private fun stockBaseName(material: StockItem): String {
    if (material.kind == "Oracal641") {
        return listOfNotNull(material.colorCode, material.colorName)
            .joinToString(" ")
            .ifBlank { "ORACAL 641" }
    }

    if (material.kind == "Ink") {
        return material.machineName ?: "Краска"
    }

    return material.materialName
        .replace(Regex("\\s+-?\\s*\\d+(?:[.,]\\d+)?\\s*м\\s*$", RegexOption.IGNORE_CASE), "")
        .trim()
}

private fun filmMarkerText(categoryName: String?): String {
    val normalized = categoryName.orEmpty().lowercase()
    if (!normalized.contains("плён") && !normalized.contains("плен")) return ""

    val codes = mutableListOf<String>()
    when {
        normalized.contains("прозрач") -> codes += "П"
        normalized.contains("бел") -> codes += "Б"
    }
    when {
        normalized.contains("глян") -> codes += "Г"
        normalized.contains("мат") -> codes += "М"
    }
    return codes.joinToString(" · ")
}

private fun filmDescription(categoryName: String?): String {
    val normalized = categoryName.orEmpty().lowercase()
    if (!normalized.contains("плён") && !normalized.contains("плен")) return ""

    val transparency = when {
        normalized.contains("прозрач") -> "Прозрачная"
        normalized.contains("бел") -> "Белая"
        else -> ""
    }
    val surface = when {
        normalized.contains("глян") -> "Глянцевая"
        normalized.contains("мат") -> "Матовая"
        else -> ""
    }
    return listOf(transparency, surface).filter { it.isNotBlank() }.joinToString(" · ")
}

private fun materialBaseName(material: MaterialItem): String {
    if (material.kind == "Oracal641") {
        return listOfNotNull(material.colorCode, material.colorName)
            .joinToString(" ")
            .ifBlank { "ORACAL 641" }
    }

    if (material.kind == "Ink") {
        return material.machineName ?: "Без станка"
    }

    return material.name
        .replace(Regex("\\s+-?\\s*\\d+[.,]\\d+\\s*м\\s*$", RegexOption.IGNORE_CASE), "")
        .trim()
}

private fun inkColorOrder(value: String?): Int {
    val index = listOf("Cyan", "Magenta", "Yellow", "Black", "White").indexOf(value)
    return if (index < 0) 99 else index
}

@Composable
private fun DateButton(
    label: String,
    value: String,
    context: android.content.Context,
    allowEmpty: Boolean = false,
    onChange: (String) -> Unit,
) {
    val initial = runCatching { LocalDate.parse(value) }.getOrDefault(LocalDate.now())
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        OutlinedButton(
            onClick = {
                DatePickerDialog(
                    context,
                    { _, year, month, day ->
                        onChange("%04d-%02d-%02d".format(year, month + 1, day))
                    },
                    initial.year,
                    initial.monthValue - 1,
                    initial.dayOfMonth,
                ).show()
            },
            modifier = Modifier.weight(1f),
        ) {
            Text(
                "$label: ${value.takeIf { it.isNotBlank() }?.split('-')?.reversed()?.joinToString(".") ?: "не выбрано"}",
            )
        }
        if (allowEmpty && value.isNotBlank()) {
            OutlinedButton(onClick = { onChange("") }) { Text("×") }
        }
    }
}

private fun parseNumber(value: String): Double? =
    value.trim().replace(',', '.').toDoubleOrNull()

private fun roundToStep(value: Double, step: Double): Double =
    kotlin.math.round(value / step) * step

private fun normalizeNumericInput(value: String): String =
    value.filter { it.isDigit() || it == '.' || it == ',' }

private fun unitLabel(unit: String): String = when (unit) {
    "Piece", "pcs" -> "шт."
    "Meter", "m" -> "м"
    "SquareMeter", "m2" -> "м²"
    "Kilogram", "kg" -> "кг"
    "Liter", "l" -> "л"
    "Roll", "roll" -> "рул."
    "Sheet", "sheet" -> "лист"
    else -> unit
}

private fun signed(value: Double, unit: String): String {
    val sign = if (value > 0) "+" else ""
    val suffix = unitLabel(unit).takeIf { it.isNotBlank() }?.let { " $it" } ?: ""
    return "$sign${numberFormat.format(value)}$suffix"
}

private fun operationLabel(type: String): String = when (type) {
    "Receiving" -> "Приход"
    "Issue" -> "Расход"
    "Inventory" -> "Инвентаризация"
    "Return" -> "Возврат"
    "WriteOff" -> "Списание"
    else -> type
}

private fun documentTypeLabel(type: String): String = when (type) {
    "Receiving" -> "Приход"
    "Issue" -> "Расход"
    "Inventory" -> "Инвентаризация"
    else -> type
}

private fun statusLabel(status: String): String = when (status) {
    "Draft" -> "Черновик"
    "Posted" -> "Проведён"
    "Cancelled" -> "Отменён"
    else -> status
}

private fun supplyStatusLabel(status: String): String = when (status) {
    "AwaitingPayment" -> "Ожидает оплаты"
    "Paid" -> "Оплачен"
    "AwaitingDelivery" -> "Ожидается поставка"
    "PartiallyReceived" -> "Получен частично"
    "FullyReceived" -> "Получен полностью"
    "Cancelled" -> "Отменён"
    else -> status
}

@Composable
private fun statusColor(status: String): Color = when (status) {
    "Posted" -> MaterialTheme.colorScheme.secondary
    "Cancelled" -> MaterialTheme.colorScheme.error
    else -> Color(0xFFFFB454)
}

private fun formatDate(value: String): String = runCatching {
    OffsetDateTime.parse(value).format(dateFormat)
}.getOrElse {
    value.replace('T', ' ').take(16)
}

private fun formatShortDate(value: String): String =
    value.split('-').takeIf { it.size == 3 }?.reversed()?.joinToString(".") ?: value

private fun WarehouseDocumentResponse.toDisplayDocument() = DisplayDocument(
    id = id,
    number = number,
    type = type,
    status = status,
    createdAtUtc = createdAtUtc,
    itemCount = items.size,
    subtitle = listOfNotNull(supplier, externalNumber).joinToString(" · "),
    warehouse = this,
)

private fun InventoryDocumentResponse.toDisplayDocument() = DisplayDocument(
    id = id,
    number = number,
    type = "Inventory",
    status = status,
    createdAtUtc = createdAtUtc,
    itemCount = totalItems,
    subtitle = if (changedItems > 0) "расхождений: $changedItems" else "",
    inventory = this,
)

private fun parseHexColor(value: String): Color = runCatching {
    Color(android.graphics.Color.parseColor(value))
}.getOrElse { Color.DarkGray }

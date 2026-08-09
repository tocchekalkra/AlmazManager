package ru.almazmanager.app.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
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
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import ru.almazmanager.app.data.ApiClient
import ru.almazmanager.app.data.ApiService
import ru.almazmanager.app.data.DashboardResponse
import ru.almazmanager.app.data.InventoryDocumentCreateItem
import ru.almazmanager.app.data.InventoryDocumentCreateRequest
import ru.almazmanager.app.data.InventoryDocumentResponse
import ru.almazmanager.app.data.MaterialItem
import ru.almazmanager.app.data.OperationItem
import ru.almazmanager.app.data.StockItem
import ru.almazmanager.app.data.WarehouseDocumentCreateItem
import ru.almazmanager.app.data.WarehouseDocumentCreateRequest
import ru.almazmanager.app.data.WarehouseDocumentResponse
import ru.almazmanager.app.data.loadAllMaterials
import ru.almazmanager.app.data.loadAllStocks
import java.text.DecimalFormat
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter

private val numberFormat = DecimalFormat("#,##0.##")
private val dateFormat = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm")

@Composable
fun DashboardScreen(api: ApiService) {
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
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        SectionHeader(
            title = "Состояние склада",
            subtitle = "Только категории, доступные текущему пользователю",
            onRefresh = { refreshKey += 1 },
        )

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
            MetricCard("Материалы", dashboard.activeMaterials.toString(), Modifier.weight(1f))
            MetricCard("Ниже мин.", dashboard.belowMinimumCount.toString(), Modifier.weight(1f), warning = true)
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            MetricCard("Приход сегодня", dashboard.receivingToday.toString(), Modifier.weight(1f))
            MetricCard("Расход сегодня", dashboard.issueToday.toString(), Modifier.weight(1f))
        }

        Text("Требуют внимания", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (dashboard.attentionMaterials.isEmpty()) {
            SuccessBlock("Все доступные материалы находятся в норме.")
        } else {
            dashboard.attentionMaterials.take(10).forEach { material ->
                SurfaceRow {
                    Column(Modifier.weight(1f)) {
                        Text(material.name, fontWeight = FontWeight.SemiBold)
                        Text(
                            "${material.article} · ${material.category}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Text(
                        "${numberFormat.format(material.quantity)} ${unitLabel(material.unit)}",
                        color = MaterialTheme.colorScheme.error,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }
        }

        Text("Последние операции", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        dashboard.recentOperations.take(8).forEach { operation ->
            SurfaceRow {
                Column(Modifier.weight(1f)) {
                    Text(operation.materialName, fontWeight = FontWeight.SemiBold)
                    Text(
                        "${operationLabel(operation.type)} · ${operation.userFullName}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    signed(operation.quantityChange, operation.unit),
                    color = if (operation.quantityChange < 0) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary,
                    fontWeight = FontWeight.Bold,
                )
            }
        }
    }
}

@Composable
fun StockScreen(api: ApiService) {
    var allItems by remember { mutableStateOf<List<StockItem>>(emptyList()) }
    var search by remember { mutableStateOf("") }
    var onlyLow by remember { mutableStateOf(false) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

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
        (query.isBlank() || item.materialName.contains(query, true) || item.article.contains(query, true)) &&
            (!onlyLow || item.belowMinimum)
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader("Остатки", "${filtered.size} позиций", onRefresh = { refreshKey += 1 })

        OutlinedTextField(
            value = search,
            onValueChange = { search = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Поиск материала") },
            singleLine = true,
        )

        OutlinedButton(onClick = { onlyLow = !onlyLow }) {
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
                items(filtered, key = { it.materialId }) { item ->
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(item.materialName, fontWeight = FontWeight.SemiBold)
                                Text(
                                    item.article,
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    "${numberFormat.format(item.currentQuantity)} ${unitLabel(item.unit)}",
                                    fontWeight = FontWeight.Bold,
                                )
                                Text(
                                    if (item.belowMinimum) "ниже минимума" else "в норме",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (item.belowMinimum) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.secondary,
                                )
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
fun MovementScreen(api: ApiService, type: String) {
    val receiving = type == "Receiving"
    val scope = rememberCoroutineScope()
    var materials by remember { mutableStateOf<List<MaterialItem>>(emptyList()) }
    var search by remember { mutableStateOf("") }
    var selected by remember { mutableStateOf<MaterialItem?>(null) }
    var quantity by remember { mutableStateOf("1") }
    var supplier by remember { mutableStateOf("") }
    var externalNumber by remember { mutableStateOf("") }
    var comment by remember { mutableStateOf("") }
    val lines = remember { mutableStateListOf<MovementLine>() }
    var loading by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            materials = api.loadAllMaterials().filter { it.isActive }
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    val candidates = materials.filter { material ->
        val query = search.trim()
        !lines.any { it.material.id == material.id } &&
            (query.isBlank() || material.name.contains(query, true) || material.article.contains(query, true) ||
                (material.colorCode?.contains(query, true) == true))
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

        if (receiving) {
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
        }

        OutlinedTextField(
            value = search,
            onValueChange = {
                search = it
                selected = null
            },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Найти материал") },
            singleLine = true,
        )

        if (search.isNotBlank() && selected == null) {
            LazyColumn(
                modifier = Modifier.fillMaxWidth().heightIn(max = 220.dp),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                items(candidates.take(20), key = { it.id }) { material ->
                    SurfaceRow(
                        modifier = Modifier.clickable {
                            selected = material
                            search = materialDisplayName(material)
                        },
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(materialDisplayName(material), fontWeight = FontWeight.SemiBold)
                            Text(material.article, style = MaterialTheme.typography.bodySmall)
                        }
                        Text("${numberFormat.format(material.currentQuantity)} ${unitLabel(material.unit)}")
                    }
                }
            }
        }

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
                    if (!receiving && amount > material.currentQuantity) {
                        error = "Нельзя списать больше текущего остатка."
                        return@Button
                    }
                    lines += MovementLine(material, amount)
                    selected = null
                    search = ""
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
                                supplier = supplier.trim().takeIf { it.isNotBlank() },
                                externalNumber = externalNumber.trim().takeIf { it.isNotBlank() },
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

@Composable
fun InventoryScreen(api: ApiService, oracal: Boolean) {
    val scope = rememberCoroutineScope()
    var materials by remember { mutableStateOf<List<MaterialItem>>(emptyList()) }
    val counts = remember { mutableStateMapOf<String, String>() }
    var search by remember { mutableStateOf("") }
    var comment by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey, oracal) {
        try {
            loading = true
            error = ""
            materials = api.loadAllMaterials().filter {
                it.isActive && if (oracal) it.kind == "Oracal641" else it.kind != "Oracal641"
            }
        } catch (requestError: Throwable) {
            error = ApiClient.errorMessage(requestError)
        } finally {
            loading = false
        }
    }

    val filtered = materials.filter { material ->
        val query = search.trim()
        query.isBlank() || material.name.contains(query, true) || material.article.contains(query, true) ||
            (material.colorCode?.contains(query, true) == true) || (material.colorName?.contains(query, true) == true)
    }

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader(
            if (oracal) "Инвентаризация ORACAL" else "Инвентаризация склада",
            "Пустое поле = не посчитано. 0 = подтверждённый ноль.",
            onRefresh = { counts.clear(); refreshKey += 1 },
        )

        OutlinedTextField(
            value = search,
            onValueChange = { search = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Поиск") },
            singleLine = true,
        )

        if (error.isNotBlank()) ErrorBlock(error)
        if (success.isNotBlank()) SuccessBlock(success)
        if (loading) LoadingBlock()

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            items(filtered, key = { it.id }) { material ->
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(12.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            if (oracal && !material.colorHex.isNullOrBlank()) {
                                Box(
                                    modifier = Modifier
                                        .size(24.dp)
                                        .background(parseHexColor(material.colorHex), RoundedCornerShape(6.dp)),
                                )
                                Spacer(Modifier.width(9.dp))
                            }
                            Column(Modifier.weight(1f)) {
                                Text(materialDisplayName(material), fontWeight = FontWeight.SemiBold)
                                Text(
                                    "Система: ${numberFormat.format(material.currentQuantity)} ${unitLabel(material.unit)}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )
                            }
                        }

                        OutlinedTextField(
                            value = counts[material.id] ?: "",
                            onValueChange = { value -> counts[material.id] = normalizeNumericInput(value) },
                            modifier = Modifier.fillMaxWidth(),
                            label = { Text("Фактический остаток") },
                            keyboardOptions = KeyboardOptions(
                                keyboardType = if (oracal) KeyboardType.Decimal else KeyboardType.Number,
                            ),
                            singleLine = true,
                        )
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

                    if (!oracal && actual % 1.0 != 0.0) {
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
)

@Composable
fun DocumentsScreen(api: ApiService) {
    var documents by remember { mutableStateOf<List<DisplayDocument>>(emptyList()) }
    var loading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey) {
        try {
            loading = true
            error = ""
            val warehouse = api.getWarehouseDocuments()
            val inventory = api.getInventoryDocuments()

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
                Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                    Column(
                        modifier = Modifier.fillMaxWidth().padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(5.dp),
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(document.number, Modifier.weight(1f), fontWeight = FontWeight.Bold)
                            Text(statusLabel(document.status), color = statusColor(document.status), fontWeight = FontWeight.SemiBold)
                        }
                        Text(
                            "${documentTypeLabel(document.type)} · ${formatDate(document.createdAtUtc)}",
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                        Text(
                            "${document.itemCount} позиций${if (document.subtitle.isNotBlank()) " · ${document.subtitle}" else ""}",
                            style = MaterialTheme.typography.bodySmall,
                        )
                    }
                }
            }
        }
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
                            Text(
                                "Было ${numberFormat.format(operation.quantityBefore)} → стало ${numberFormat.format(operation.quantityAfter)}",
                                style = MaterialTheme.typography.bodySmall,
                            )
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
private fun MetricCard(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    warning: Boolean = false,
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(label, color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodySmall)
            Text(
                value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = if (warning) Color(0xFFFFB454) else MaterialTheme.colorScheme.onSurface,
            )
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
    val color = if (material.kind == "Oracal641") {
        listOfNotNull(material.colorCode, material.colorName).joinToString(" ").trim()
    } else {
        ""
    }
    val width = material.widthMeters?.let { " · ${numberFormat.format(it)} м" } ?: ""
    return listOf(material.name, color).filter { it.isNotBlank() }.joinToString(" · ") + width
}

private fun parseNumber(value: String): Double? =
    value.trim().replace(',', '.').toDoubleOrNull()

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

private fun WarehouseDocumentResponse.toDisplayDocument() = DisplayDocument(
    id = id,
    number = number,
    type = type,
    status = status,
    createdAtUtc = createdAtUtc,
    itemCount = items.size,
    subtitle = listOfNotNull(supplier, externalNumber).joinToString(" · "),
)

private fun InventoryDocumentResponse.toDisplayDocument() = DisplayDocument(
    id = id,
    number = number,
    type = "Inventory",
    status = status,
    createdAtUtc = createdAtUtc,
    itemCount = totalItems,
    subtitle = if (changedItems > 0) "расхождений: $changedItems" else "",
)

private fun parseHexColor(value: String): Color = runCatching {
    Color(android.graphics.Color.parseColor(value))
}.getOrElse { Color.DarkGray }

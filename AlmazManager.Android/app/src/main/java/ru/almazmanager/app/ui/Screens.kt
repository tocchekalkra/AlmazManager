package ru.almazmanager.app.ui

import android.app.DatePickerDialog
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
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ErrorOutline
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.LockOpen
import androidx.compose.material.icons.filled.Remove
import androidx.compose.material.icons.filled.Refresh
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
        MetricCard("Расход вчера", dashboard.issueYesterday.toString(), Modifier.fillMaxWidth())

        Text("Расход за 7 дней", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(dashboard.consumptionDays, key = { it.date }) { day ->
                Card(
                    modifier = Modifier.width(104.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                ) {
                    Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(day.date.takeLast(5).replace('-', '.'), style = MaterialTheme.typography.labelMedium)
                        Text(day.documentCount.toString(), style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                        Text("документов", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        day.topMaterial?.let { Text(it, style = MaterialTheme.typography.labelSmall, maxLines = 2) }
                    }
                }
            }
        }

        Text("Требуют внимания", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (dashboard.attentionMaterials.isEmpty()) {
            SuccessBlock("Все доступные материалы находятся в норме.")
        } else {
            dashboard.attentionMaterials.take(3).forEach { material ->
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
        dashboard.recentOperations.take(3).forEach { operation ->
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

        Text("Последние документы", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        dashboard.recentDocuments.take(3).forEach { document ->
            SurfaceRow {
                Column(Modifier.weight(1f)) {
                    Text(document.number, fontWeight = FontWeight.SemiBold)
                    Text(
                        "${documentTypeLabel(document.type)} · ${document.userFullName}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text("${document.itemCount} поз.", fontWeight = FontWeight.Bold)
            }
        }
    }
}

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
    val grouped = filtered.groupBy { item ->
        if (item.kind == "Oracal641") "ORACAL 641" else item.categoryName
    }

    fun moveMaterial(materialId: String, direction: Int) {
        if (!orderMode || savingOrder) return
        val next = allItems.toMutableList()
        val from = next.indexOfFirst { it.materialId == materialId }
        val to = (from + direction).coerceIn(0, next.lastIndex)
        if (from < 0 || from == to) return
        val moved = next.removeAt(from)
        next.add(to, moved)
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
                grouped.forEach { (categoryName, categoryItems) ->
                    item(key = "category-$categoryName") {
                        Text(
                            categoryName,
                            modifier = Modifier.padding(top = 10.dp, bottom = 2.dp),
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }

                    items(categoryItems, key = { it.materialId }) { item ->
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            if (item.kind == "Oracal641" && !item.colorHex.isNullOrBlank()) {
                                Box(
                                    modifier = Modifier
                                        .size(28.dp)
                                        .background(parseHexColor(item.colorHex), RoundedCornerShape(7.dp)),
                                )
                                Spacer(Modifier.width(10.dp))
                            }
                            Column(Modifier.weight(1f)) {
                                Text(stockDisplayName(item), fontWeight = FontWeight.SemiBold)
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
                                if (item.expectedQuantity > 0) {
                                    Text(
                                        "+${numberFormat.format(item.expectedQuantity)} ${unitLabel(item.unit)} в пути",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.primary,
                                    )
                                }
                            }
                            if (orderMode) {
                                Spacer(Modifier.width(8.dp))
                                Column {
                                    IconButton(onClick = { moveMaterial(item.materialId, -1) }) {
                                        Text("↑", fontWeight = FontWeight.Bold)
                                    }
                                    IconButton(onClick = { moveMaterial(item.materialId, 1) }) {
                                        Text("↓", fontWeight = FontWeight.Bold)
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

    SelectionDropdown(
        label = "Категория",
        value = availableCategories.firstOrNull { it.id == selectedCategoryId }?.name.orEmpty(),
        placeholder = "Выберите категорию",
        options = availableCategories.map { it.id to it.name },
        onSelect = onCategorySelected,
    )

    SelectionDropdown(
        label = "Материал",
        value = selectedMaterialName,
        placeholder = if (selectedCategoryId.isBlank()) "Сначала выберите категорию" else "Выберите материал",
        options = materialGroups.map { it.key to it.key },
        enabled = selectedCategoryId.isNotBlank(),
        onSelect = onMaterialSelected,
    )

    SelectionDropdown(
        label = "Ширина",
        value = widthMaterials.firstOrNull { it.id == selectedMaterialId }
            ?.let(::materialDisplayName)
            .orEmpty(),
        placeholder = if (selectedMaterialName.isBlank()) "Сначала выберите материал" else "Выберите ширину",
        options = widthMaterials.map { material ->
            material.id to "${material.widthMeters?.let { "${numberFormat.format(it)} м" } ?: "Без ширины"} · " +
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
                    if (!receiving && amount > material.currentQuantity) {
                        error = "Нельзя списать больше текущего остатка."
                        return@Button
                    }
                    lines += MovementLine(material, amount)
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
                                } else {
                                    lines += SupplyDraftLine(material, value)
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
            SupplyCard(supply)
        }
    }
}

@Composable
private fun SupplyCard(supply: SupplyInvoiceResponse) {
    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
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
                Text(supplyStatusLabel(supply.status), color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.SemiBold)
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
    var error by remember { mutableStateOf("") }
    var success by remember { mutableStateOf("") }
    var refreshKey by remember { mutableStateOf(0) }

    LaunchedEffect(refreshKey, oracal) {
        try {
            loading = true
            error = ""
            val loadedMaterials = api.loadAllMaterials().filter {
                it.isActive && if (oracal) it.kind == "Oracal641" else it.kind != "Oracal641"
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

    Column(
        modifier = Modifier.fillMaxSize().padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        SectionHeader(
            if (oracal) "Инвентаризация ORACAL" else "Инвентаризация склада",
            "Сначала нажмите на нужную ширину, затем используйте кнопки минус и плюс.",
            onRefresh = { counts.clear(); selectedMaterialId = null; refreshKey += 1 },
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

                materialGroups.forEach { (materialName, widths) ->
                    item(key = "inventory-group-${category.id}-$materialName") {
                        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)) {
                            Column(Modifier.fillMaxWidth().padding(10.dp)) {
                                Text(
                                    materialName,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 5.dp),
                                    fontWeight = FontWeight.Bold,
                                )
                                Text(
                                    "Ширина     Фактически                По системе",
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp),
                                    style = MaterialTheme.typography.labelSmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                )

                                widths.forEach { material ->
                                    val selected = selectedMaterialId == material.id
                                    val actual = parseNumber(counts[material.id].orEmpty())
                                    val displayActual = actual ?: material.currentQuantity

                                    Column(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .background(
                                                if (selected) MaterialTheme.colorScheme.primary.copy(alpha = 0.10f)
                                                else Color.Transparent,
                                                RoundedCornerShape(9.dp),
                                            )
                                            .clickable {
                                                selectedMaterialId = material.id
                                                if (counts[material.id].isNullOrBlank()) {
                                                    counts[material.id] = numberFormat.format(material.currentQuantity)
                                                }
                                            }
                                            .padding(horizontal = 5.dp, vertical = 6.dp),
                                    ) {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            if (oracal && !material.colorHex.isNullOrBlank()) {
                                                Box(
                                                    Modifier.size(18.dp).background(
                                                        parseHexColor(material.colorHex),
                                                        RoundedCornerShape(5.dp),
                                                    ),
                                                )
                                                Spacer(Modifier.width(6.dp))
                                            }
                                            Text(
                                                material.widthMeters?.let { "${numberFormat.format(it)} м" } ?: "—",
                                                modifier = Modifier.width(65.dp),
                                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                            )
                                            OutlinedButton(
                                                onClick = {
                                                    counts[material.id] = numberFormat.format((displayActual - 1.0).coerceAtLeast(0.0))
                                                },
                                                enabled = selected,
                                                modifier = Modifier.size(42.dp),
                                            ) { Text("−", style = MaterialTheme.typography.titleLarge) }
                                            Text(
                                                numberFormat.format(displayActual),
                                                modifier = Modifier.width(64.dp),
                                                textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                                                fontWeight = FontWeight.Bold,
                                            )
                                            OutlinedButton(
                                                onClick = { counts[material.id] = numberFormat.format(displayActual + 1.0) },
                                                enabled = selected,
                                                modifier = Modifier.size(42.dp),
                                            ) { Text("+", style = MaterialTheme.typography.titleLarge) }
                                            Text(
                                                numberFormat.format(material.currentQuantity),
                                                modifier = Modifier.weight(1f),
                                                textAlign = androidx.compose.ui.text.style.TextAlign.End,
                                                fontWeight = FontWeight.Bold,
                                            )
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
    return width?.let { "$name - $it" } ?: name
}

private fun stockDisplayName(material: StockItem): String {
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
    return width?.let { "$name - $it" } ?: name
}

private fun materialBaseName(material: MaterialItem): String {
    if (material.kind == "Oracal641") {
        return listOfNotNull(material.colorCode, material.colorName)
            .joinToString(" ")
            .ifBlank { "ORACAL 641" }
    }

    return material.name
        .replace(Regex("\\s+-?\\s*\\d+[.,]\\d+\\s*м\\s*$", RegexOption.IGNORE_CASE), "")
        .trim()
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

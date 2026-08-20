package ru.almazmanager.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Login
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.LocalShipping
import androidx.compose.material.icons.filled.MoreHoriz
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Output
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Warehouse
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationRail
import androidx.compose.material3.NavigationRailItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch
import ru.almazmanager.app.data.ApiClient
import ru.almazmanager.app.data.CurrentUserAccess
import ru.almazmanager.app.data.LoginRequest
import ru.almazmanager.app.data.LoginResponse
import ru.almazmanager.app.data.UserSession

private enum class Screen(
    val title: String,
    val icon: ImageVector,
) {
    Dashboard("Обзор", Icons.Default.Dashboard),
    Stock("Склад", Icons.Default.Warehouse),
    Receiving("Приход", Icons.Default.Inventory2),
    Issue("Расход", Icons.Default.Output),
    Inventory("Инвентаризация", Icons.AutoMirrored.Filled.ReceiptLong),
    Oracal("ORACAL 641", Icons.Default.Palette),
    Documents("Документы", Icons.Default.Description),
    Operations("Журнал операций", Icons.Default.Assessment),
    Supplies("Поставки", Icons.Default.LocalShipping),
    Notifications("Уведомления", Icons.Default.Notifications),
    Settings("Настройки", Icons.Default.Settings),
    More("Ещё", Icons.Default.MoreHoriz),
}

@Composable
fun AlmazManagerApp(
    session: UserSession?,
    lastBaseUrl: String,
    onLogin: (String, LoginResponse) -> Unit,
    onLogout: () -> Unit,
    onThemeChange: (String) -> Unit,
) {
    if (session == null) {
        LoginScreen(
            initialBaseUrl = lastBaseUrl,
            onLogin = onLogin,
        )
    } else {
        MainShell(
            session = session,
            onLogout = onLogout,
            onThemeChange = onThemeChange,
        )
    }
}

@Composable
private fun LoginScreen(
    initialBaseUrl: String,
    onLogin: (String, LoginResponse) -> Unit,
) {
    val scope = rememberCoroutineScope()
    var baseUrl by remember { mutableStateOf(initialBaseUrl) }
    var login by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var busy by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center,
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface,
            ),
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                Text(
                    text = "AlmazManager",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                )
                Text(
                    text = "Склад в одном приложении",
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                Spacer(Modifier.height(4.dp))

                OutlinedTextField(
                    value = baseUrl,
                    onValueChange = { baseUrl = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Адрес API") },
                    placeholder = { Text("https://warehouse.example.ru/api") },
                    singleLine = true,
                )

                OutlinedTextField(
                    value = login,
                    onValueChange = { login = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Логин") },
                    singleLine = true,
                )

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Пароль") },
                    visualTransformation = PasswordVisualTransformation(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                    singleLine = true,
                )

                if (error.isNotBlank()) {
                    Text(error, color = MaterialTheme.colorScheme.error)
                }

                Button(
                    onClick = {
                        if (baseUrl.isBlank() || login.isBlank() || password.isBlank()) {
                            error = "Укажите сервер, логин и пароль."
                            return@Button
                        }

                        scope.launch {
                            try {
                                busy = true
                                error = ""
                                val response = ApiClient.create(baseUrl).login(
                                    LoginRequest(login.trim(), password),
                                )
                                onLogin(baseUrl, response)
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
                    if (busy) {
                        CircularProgressIndicator(
                            modifier = Modifier.width(20.dp),
                            strokeWidth = 2.dp,
                        )
                        Spacer(Modifier.width(10.dp))
                    } else {
                        Icon(Icons.AutoMirrored.Filled.Login, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                    }
                    Text(if (busy) "Вход..." else "Войти")
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun MainShell(
    session: UserSession,
    onLogout: () -> Unit,
    onThemeChange: (String) -> Unit,
) {
    val api = remember(session) { ApiClient.create(session.baseUrl, session.token) }
    var currentScreen by remember { mutableStateOf(Screen.Dashboard) }
    var unreadCount by remember { mutableStateOf(0) }
    var access by remember {
        mutableStateOf(
            CurrentUserAccess(
                canInventoryStandard = session.role == "Administrator",
                canInventoryOracal = session.role == "Administrator",
                canManageSupplies = session.role == "Administrator",
            ),
        )
    }

    LaunchedEffect(session.token) {
        runCatching { api.getCurrentUserAccess() }
            .onSuccess { access = it }
        runCatching { api.getNotifications() }
            .onSuccess { unreadCount = it.unreadCount }
    }

    fun isVisible(screen: Screen): Boolean =
        when (screen) {
            Screen.Inventory -> access.canInventoryStandard
            Screen.Oracal -> access.canInventoryOracal
            Screen.Supplies -> access.canManageSupplies
            else -> true
        }

    val primaryScreens = listOf(Screen.Dashboard, Screen.Stock, Screen.Receiving, Screen.Issue, Screen.More)
    val moreScreens = listOf(
        Screen.Inventory,
        Screen.Oracal,
        Screen.Documents,
        Screen.Operations,
        Screen.Supplies,
        Screen.Notifications,
        Screen.Settings,
    ).filter(::isVisible)

    BoxWithConstraints(Modifier.fillMaxSize()) {
        val useRail = maxWidth >= 840.dp

        Row(Modifier.fillMaxSize()) {
            if (useRail) {
                NavigationRail {
                    Spacer(Modifier.height(12.dp))
                    primaryScreens.forEach { screen ->
                        NavigationRailItem(
                            selected = currentScreen == screen ||
                                (screen == Screen.More && currentScreen in moreScreens),
                            onClick = { currentScreen = screen },
                            icon = { Icon(screen.icon, contentDescription = screen.title) },
                            label = { Text(screen.title) },
                        )
                    }
                }
            }

            Scaffold(
                modifier = Modifier.weight(1f),
                topBar = {
                    TopAppBar(
                        title = { Text(currentScreen.title) },
                        actions = {
                            IconButton(onClick = { currentScreen = Screen.Notifications }) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.Notifications, contentDescription = "Уведомления")
                                    if (unreadCount > 0) {
                                        Text(
                                            unreadCount.coerceAtMost(99).toString(),
                                            style = MaterialTheme.typography.labelSmall,
                                            color = MaterialTheme.colorScheme.primary,
                                        )
                                    }
                                }
                            }
                        },
                    )
                },
                bottomBar = {
                    if (!useRail) {
                        NavigationBar {
                            primaryScreens.forEach { screen ->
                                NavigationBarItem(
                                    selected = currentScreen == screen ||
                                        (screen == Screen.More && currentScreen in moreScreens),
                                    onClick = { currentScreen = screen },
                                    icon = { Icon(screen.icon, contentDescription = screen.title) },
                                    label = { Text(screen.title) },
                                )
                            }
                        }
                    }
                },
            ) { padding ->
                Box(Modifier.fillMaxSize().padding(padding)) {
                    when (currentScreen) {
                        Screen.Dashboard -> DashboardScreen(
                            api = api,
                            fullName = session.fullName,
                            onOpenStock = { currentScreen = Screen.Stock },
                            onOpenDocuments = { currentScreen = Screen.Documents },
                        )
                        Screen.Stock -> StockScreen(api)
                        Screen.Receiving -> MovementScreen(api, "Receiving")
                        Screen.Issue -> MovementScreen(api, "Issue")
                        Screen.Inventory -> InventoryScreen(api, oracal = false)
                        Screen.Oracal -> InventoryScreen(api, oracal = true)
                        Screen.Documents -> DocumentsScreen(api)
                        Screen.Operations -> OperationsScreen(api)
                        Screen.Supplies -> SuppliesScreen(api)
                        Screen.Notifications -> NotificationsScreen(api) { unreadCount = it }
                        Screen.Settings -> SettingsScreen(api, access.theme, onThemeChange)
                        Screen.More -> MoreScreen(
                            fullName = session.fullName,
                            role = session.role,
                            screens = moreScreens.map { NavigationOption(it.title, it.icon) },
                            onSelect = { title ->
                                moreScreens.firstOrNull { it.title == title }?.let { currentScreen = it }
                            },
                            onLogout = onLogout,
                        )
                    }
                }
            }
        }
    }
}

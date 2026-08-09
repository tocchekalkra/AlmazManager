package ru.almazmanager.app.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.weight
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Assessment
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Output
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.ReceiptLong
import androidx.compose.material.icons.filled.Warehouse
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDrawerState
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
import androidx.compose.ui.text.input.KeyboardOptions
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
    Inventory("Инвентаризация", Icons.Default.ReceiptLong),
    Oracal("ORACAL 641", Icons.Default.Palette),
    Documents("Документы", Icons.Default.Description),
    Operations("Журнал операций", Icons.Default.Assessment),
}

@Composable
fun AlmazManagerApp(
    session: UserSession?,
    lastBaseUrl: String,
    onLogin: (String, LoginResponse) -> Unit,
    onLogout: () -> Unit,
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
                        Icon(Icons.Default.Login, contentDescription = null)
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
) {
    val api = remember(session) { ApiClient.create(session.baseUrl, session.token) }
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var currentScreen by remember { mutableStateOf(Screen.Dashboard) }
    var access by remember {
        mutableStateOf(
            CurrentUserAccess(
                canInventoryStandard = session.role == "Administrator",
                canInventoryOracal = session.role == "Administrator",
            ),
        )
    }

    LaunchedEffect(session.token) {
        runCatching { api.getCurrentUserAccess() }
            .onSuccess { access = it }
    }

    val visibleScreens = Screen.entries.filter { screen ->
        when (screen) {
            Screen.Inventory -> access.canInventoryStandard
            Screen.Oracal -> access.canInventoryOracal
            else -> true
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        "AlmazManager",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        session.fullName,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                    Text(
                        session.role,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                    )
                }

                Divider()

                visibleScreens.forEach { screen ->
                    NavigationDrawerItem(
                        label = { Text(screen.title) },
                        selected = currentScreen == screen,
                        icon = { Icon(screen.icon, contentDescription = null) },
                        onClick = {
                            currentScreen = screen
                            scope.launch { drawerState.close() }
                        },
                        modifier = Modifier.padding(horizontal = 10.dp),
                    )
                }

                Spacer(Modifier.weight(1f))

                NavigationDrawerItem(
                    label = { Text("Выйти") },
                    selected = false,
                    icon = { Icon(Icons.Default.Logout, contentDescription = null) },
                    onClick = onLogout,
                    modifier = Modifier.padding(10.dp),
                )
            }
        },
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(currentScreen.title) },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Меню")
                        }
                    },
                    actions = {
                        IconButton(onClick = onLogout) {
                            Icon(Icons.Default.Close, contentDescription = "Выйти")
                        }
                    },
                )
            },
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
            ) {
                when (currentScreen) {
                    Screen.Dashboard -> DashboardScreen(api)
                    Screen.Stock -> StockScreen(api)
                    Screen.Receiving -> MovementScreen(api, "Receiving")
                    Screen.Issue -> MovementScreen(api, "Issue")
                    Screen.Inventory -> InventoryScreen(api, oracal = false)
                    Screen.Oracal -> InventoryScreen(api, oracal = true)
                    Screen.Documents -> DocumentsScreen(api)
                    Screen.Operations -> OperationsScreen(api)
                }
            }
        }
    }
}

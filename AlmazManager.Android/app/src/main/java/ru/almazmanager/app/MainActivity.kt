package ru.almazmanager.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import ru.almazmanager.app.data.SessionStore
import ru.almazmanager.app.ui.AlmazManagerApp
import ru.almazmanager.app.ui.AlmazManagerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            AlmazManagerTheme {
                val store = remember { SessionStore(applicationContext) }
                var session by remember { mutableStateOf(store.load()) }

                AlmazManagerApp(
                    session = session,
                    lastBaseUrl = store.lastBaseUrl(),
                    onLogin = { baseUrl, response ->
                        session = store.save(baseUrl, response)
                    },
                    onLogout = {
                        store.clear()
                        session = null
                    },
                )
            }
        }
    }
}

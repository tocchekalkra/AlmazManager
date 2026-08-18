package ru.almazmanager.app.data

import android.content.Context

data class UserSession(
    val baseUrl: String,
    val token: String,
    val fullName: String,
    val login: String,
    val role: String,
)

class SessionStore(context: Context) {
    private val preferences = context.getSharedPreferences(
        "almazmanager_session",
        Context.MODE_PRIVATE,
    )

    fun load(): UserSession? {
        val token = preferences.getString("token", null) ?: return null
        val baseUrl = preferences.getString("base_url", null) ?: return null

        return UserSession(
            baseUrl = baseUrl,
            token = token,
            fullName = preferences.getString("full_name", "Пользователь") ?: "Пользователь",
            login = preferences.getString("login", "") ?: "",
            role = preferences.getString("role", "") ?: "",
        )
    }

    fun lastBaseUrl(): String =
        preferences.getString("base_url", "http://10.0.2.2:5003/api")
            ?: "http://10.0.2.2:5003/api"

    fun save(baseUrl: String, response: LoginResponse): UserSession {
        val session = UserSession(
            baseUrl = ApiClient.normalizeBaseUrl(baseUrl),
            token = response.accessToken,
            fullName = response.fullName,
            login = response.login,
            role = response.role,
        )

        preferences.edit()
            .putString("base_url", session.baseUrl)
            .putString("token", session.token)
            .putString("full_name", session.fullName)
            .putString("login", session.login)
            .putString("role", session.role)
            .apply()

        return session
    }

    fun clear() {
        preferences.edit().remove("token").apply()
    }

    fun theme(): String = preferences.getString("theme", "System") ?: "System"

    fun saveTheme(theme: String) {
        preferences.edit().putString("theme", theme).apply()
    }
}

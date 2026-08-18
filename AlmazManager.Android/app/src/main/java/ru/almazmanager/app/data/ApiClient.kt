package ru.almazmanager.app.data

import com.google.gson.Gson
import okhttp3.OkHttpClient
import retrofit2.HttpException
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

object ApiClient {
    private val gson = Gson()

    fun normalizeBaseUrl(value: String): String {
        var url = value.trim()

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://$url"
        }

        url = url.trimEnd('/')

        if (!url.endsWith("/api", ignoreCase = true)) {
            url += "/api"
        }

        return "$url/"
    }

    fun create(baseUrl: String, token: String? = null): ApiService {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("Accept", "application/json")
                    .apply {
                        if (!token.isNullOrBlank()) {
                            header("Authorization", "Bearer $token")
                        }
                    }
                    .build()

                chain.proceed(request)
            }
            .build()

        return Retrofit.Builder()
            .baseUrl(normalizeBaseUrl(baseUrl))
            .client(client)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(ApiService::class.java)
    }

    fun errorMessage(error: Throwable): String {
        if (error is HttpException) {
            val body = runCatching { error.response()?.errorBody()?.string() }.getOrNull()

            if (!body.isNullOrBlank()) {
                val message = runCatching {
                    @Suppress("UNCHECKED_CAST")
                    (gson.fromJson(body, Map::class.java) as Map<String, Any?>)["message"] as? String
                }.getOrNull()

                if (!message.isNullOrBlank()) {
                    return message
                }
            }

            return "Ошибка API: HTTP ${error.code()}"
        }

        return error.message ?: "Не удалось выполнить запрос к серверу."
    }
}

suspend fun ApiService.loadAllMaterials(): List<MaterialItem> {
    val result = mutableListOf<MaterialItem>()
    var page = 1
    var totalPages = 1

    do {
        val response = getMaterials(page = page, pageSize = 2000)
        result += response.items
        totalPages = response.totalPages
        page += 1
    } while (page <= totalPages)

    return result
}

suspend fun ApiService.loadAllStocks(): List<StockItem> {
    val result = mutableListOf<StockItem>()
    var page = 1
    var totalPages = 1

    do {
        val response = getStocks(page = page, pageSize = 2000)
        result += response.items
        totalPages = response.totalPages
        page += 1
    } while (page <= totalPages)

    return result
}

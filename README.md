# AlmazManager

AlmazManager — система складского учёта для рекламного производства. Все клиенты работают с единой PostgreSQL только через ASP.NET Core REST API.

Текущая версия: **2.1.0**. Основные изменения релиза перечислены в `CHANGELOG.md`.

## Состав проекта

- `AlmazManager.API` — ASP.NET Core API, JWT, права доступа, Swagger в Development.
- `AlmazManager.Application` — бизнес-логика.
- `AlmazManager.Contracts` — API-контракты.
- `AlmazManager.Domain` — доменная модель склада.
- `AlmazManager.Infrastructure` — EF Core, PostgreSQL, репозитории и миграции.
- `AlmazManager.Web` — React + TypeScript + Vite.
- `AlmazManager.Android` — Android-клиент Kotlin + Jetpack Compose.

## Быстрый запуск Web/API/PostgreSQL

1. Скопируйте `.env.example` в `.env`.
2. Обязательно замените пароли БД, администратора и `ALMAZ_JWT_SECRET`.
3. Запустите `docker compose -f docker-compose.production.yml up -d --build`.
4. Откройте `http://localhost:8088` или порт из `ALMAZ_WEB_PORT`.

Секреты и строка подключения не хранятся в `appsettings*.json`: для локального запуска задайте `ConnectionStrings__DefaultConnection` и `Jwt__SecretKey` через переменные окружения либо используйте `.env` с Docker Compose. Файл `.env` не добавляйте в Git.

При первом запуске на пустой БД миграции применяются автоматически. Если пользователей ещё нет, создаётся первый Administrator из `ALMAZ_ADMIN_*`. На существующей БД пользователи и данные не изменяются.

При обновлении сначала создайте резервную копию PostgreSQL. Миграции 2.x не удаляют существующие складские данные; версия 2.1.0 дополнительно создаёт четыре категории плёнок, если их ещё нет.

## Локальная разработка

- PostgreSQL: `docker compose up -d`.
- API: `dotnet run --project AlmazManager.API`.
- Web: `cd AlmazManager.Web && npm ci && npm run dev`.
- Web по умолчанию обращается к `http://localhost:5003/api`; адрес можно переопределить через `VITE_API_BASE_URL`.

## Android

Android-клиент не хранит прямого доступа к PostgreSQL. На экране входа задаётся адрес API, например `https://warehouse.example.ru/api` или для эмулятора `http://10.0.2.2:5003/api`.

Сборка debug APK: `cd AlmazManager.Android && ./gradlew assembleDebug`.

Основной Android-проект использует Kotlin + Jetpack Compose. Каталог `AlmazManager.Android/native` содержит dependency-free нативный клиент того же REST API, из которого можно собрать установочный APK только средствами Android SDK/JDK; он оставлен в проекте как воспроизводимый вариант без Maven-зависимостей.

## HTTPS и резервные копии

Контейнер `web` публикует HTTP только на внутреннем/локальном порту. В production этот порт следует закрыть от публичного доступа и завершать TLS на Caddy, nginx, Traefik или другом reverse proxy с действующим сертификатом. Публичный Android/Web URL должен использовать `https://`.

Резервная копия PostgreSQL из production compose:

```bash
docker compose -f docker-compose.production.yml exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > almazmanager.backup
```

Восстановление выполняйте только в целевую пустую/подготовленную БД после остановки `api`:

```bash
docker compose -f docker-compose.production.yml stop api
docker compose -f docker-compose.production.yml exec -T postgres sh -c 'pg_restore --clean --if-exists -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < almazmanager.backup
docker compose -f docker-compose.production.yml start api
```

Перед обновлением production сначала делайте backup и проверяйте восстановление на отдельной БД.

## Безопасность данных

- пользователь складской операции определяется только из JWT;
- права категорий проверяются на backend;
- изменение остатков происходит через операции и документы;
- отмена проведённых документов доступна Administrator и создаёт обратные движения;
- архивные материалы сохраняются для истории;
- журнал операций и Dashboard фильтруются по `CanView`.

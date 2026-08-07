using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Claims;
using System.Text;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using WarehouseManager.API.Middlewares;

using WarehouseManager.Application.Features.Authentication.Handlers;
using WarehouseManager.Application.Features.Categories.Handlers;
using WarehouseManager.Application.Features.Dashboard.Handlers;
using WarehouseManager.Application.Features.Documents.Handlers;
using WarehouseManager.Application.Features.Inventory.Handlers;
using WarehouseManager.Application.Features.InventoryDocuments.Handlers;
using WarehouseManager.Application.Features.Issue.Handlers;
using WarehouseManager.Application.Features.Materials.Handlers;
using WarehouseManager.Application.Features.Operations.Handlers;
using WarehouseManager.Application.Features.Receiving.Handlers;
using WarehouseManager.Application.Features.Stocks.Handlers;
using WarehouseManager.Application.Features.Users.Handlers;

using WarehouseManager.Application.Interfaces;
using WarehouseManager.Application.Options;

using WarehouseManager.Domain.Interfaces;

using WarehouseManager.Infrastructure.Database;
using WarehouseManager.Infrastructure.Identity;
using WarehouseManager.Infrastructure.Repositories;


// ============================================================
// BUILDER
// ============================================================

var builder = WebApplication.CreateBuilder(args);


// ============================================================
// CONFIGURATION
// ============================================================

builder.Configuration.AddJsonFile(
    "jwtsettings.json",
    optional: false,
    reloadOnChange: true);


// ============================================================
// JWT SETTINGS
// ============================================================

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "Настройки JWT не найдены.");

if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey) ||
    jwtOptions.SecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "Секретный ключ JWT должен содержать минимум 32 символа.");
}

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(
        JwtOptions.SectionName));


// ============================================================
// DATABASE
// ============================================================

builder.Services.AddDbContext<WarehouseDbContext>(
    options =>
        options.UseNpgsql(
            builder.Configuration.GetConnectionString(
                "DefaultConnection")));


// ============================================================
// CORS
// ============================================================
// Разрешаем локальному React/Vite обращаться к API.
// Позже, когда приложение будет размещено на сервере,
// заменим localhost на реальный адрес frontend.
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "WarehouseManagerWeb",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:5173",
                    "https://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});


// ============================================================
// AUTHENTICATION
// ============================================================

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuer = jwtOptions.Issuer,

                ValidateAudience = true,
                ValidAudience = jwtOptions.Audience,

                ValidateIssuerSigningKey = true,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtOptions.SecretKey)),

                ValidateLifetime = true,

                ClockSkew =
                    TimeSpan.FromSeconds(30),

                NameClaimType =
                    ClaimTypes.Name,

                RoleClaimType =
                    ClaimTypes.Role
            };
    });

builder.Services.AddAuthorization();


// ============================================================
// REPOSITORIES
// ============================================================

builder.Services.AddScoped<
    IMaterialRepository,
    MaterialRepository>();

builder.Services.AddScoped<
    ICategoryRepository,
    CategoryRepository>();

builder.Services.AddScoped<
    IStockRepository,
    StockRepository>();

builder.Services.AddScoped<
    IOperationRepository,
    OperationRepository>();

builder.Services.AddScoped<
    IUserRepository,
    UserRepository>();

builder.Services.AddScoped<
    IWarehouseDocumentRepository,
    WarehouseDocumentRepository>();

builder.Services.AddScoped<
    IInventoryDocumentRepository,
    InventoryDocumentRepository>();


// ============================================================
// SERVICES
// ============================================================

builder.Services.AddScoped<
    IPasswordService,
    PasswordService>();

builder.Services.AddScoped<
    IJwtTokenService,
    JwtTokenService>();


// ============================================================
// AUTHENTICATION HANDLERS
// ============================================================

builder.Services.AddScoped<LoginUserHandler>();


// ============================================================
// USER HANDLERS
// ============================================================

builder.Services.AddScoped<RegisterUserHandler>();
builder.Services.AddScoped<GetUsersHandler>();


// ============================================================
// CATEGORY HANDLERS
// ============================================================

builder.Services.AddScoped<CreateCategoryHandler>();
builder.Services.AddScoped<GetCategoriesHandler>();
builder.Services.AddScoped<GetCategoryByIdHandler>();
builder.Services.AddScoped<UpdateCategoryHandler>();
builder.Services.AddScoped<SetCategoryActivityHandler>();


// ============================================================
// MATERIAL HANDLERS
// ============================================================

builder.Services.AddScoped<CreateMaterialHandler>();
builder.Services.AddScoped<GetMaterialsHandler>();
builder.Services.AddScoped<GetMaterialCatalogHandler>();
builder.Services.AddScoped<GetMaterialByIdHandler>();
builder.Services.AddScoped<UpdateMaterialHandler>();
builder.Services.AddScoped<SetMaterialActivityHandler>();


// ============================================================
// STOCK HANDLERS
// ============================================================

builder.Services.AddScoped<GetStocksHandler>();
builder.Services.AddScoped<GetStockCatalogHandler>();


// ============================================================
// OPERATION HANDLERS
// ============================================================

builder.Services.AddScoped<GetOperationsHandler>();
builder.Services.AddScoped<GetOperationCatalogHandler>();
builder.Services.AddScoped<GetOperationJournalHandler>();


// ============================================================
// RECEIVING / ISSUE
// ============================================================
// Старый API пока оставляем для совместимости.
// Позже операции окончательно будут идти через документы.
// ============================================================

builder.Services.AddScoped<ReceiveMaterialHandler>();
builder.Services.AddScoped<IssueMaterialHandler>();


// ============================================================
// OLD INVENTORY HANDLERS
// ============================================================

builder.Services.AddScoped<InventoryAdjustmentHandler>();
builder.Services.AddScoped<BulkInventoryHandler>();


// ============================================================
// INVENTORY DOCUMENT HANDLERS
// ============================================================

builder.Services.AddScoped<
    CreateInventoryDocumentHandler>();

builder.Services.AddScoped<
    GetInventoryDocumentsHandler>();

builder.Services.AddScoped<
    UpdateInventoryDocumentHandler>();

builder.Services.AddScoped<
    DeleteInventoryDocumentHandler>();

builder.Services.AddScoped<
    PostInventoryDocumentHandler>();

builder.Services.AddScoped<
    CancelInventoryDocumentHandler>();


// ============================================================
// WAREHOUSE DOCUMENT HANDLERS
// ============================================================

builder.Services.AddScoped<
    CreateWarehouseDocumentHandler>();

builder.Services.AddScoped<
    GetWarehouseDocumentsHandler>();

builder.Services.AddScoped<
    UpdateWarehouseDocumentHandler>();

builder.Services.AddScoped<
    DeleteWarehouseDocumentHandler>();

builder.Services.AddScoped<
    PostWarehouseDocumentHandler>();

builder.Services.AddScoped<
    CancelWarehouseDocumentHandler>();


// ============================================================
// DASHBOARD
// ============================================================

builder.Services.AddScoped<GetDashboardHandler>();


// ============================================================
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();


// ============================================================
// SWAGGER
// ============================================================

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "WarehouseManager API",
            Version = "v1",
            Description =
                "API системы складского учета WarehouseManager"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",

            Type =
                SecuritySchemeType.Http,

            Scheme =
                "bearer",

            BearerFormat =
                "JWT",

            In =
                ParameterLocation.Header,

            Description =
                "Вставьте JWT-токен без слова Bearer."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type =
                                ReferenceType.SecurityScheme,

                            Id =
                                "Bearer"
                        }
                },

                Array.Empty<string>()
            }
        });
});


// ============================================================
// APPLICATION
// ============================================================

var app = builder.Build();


// ============================================================
// AUTO START REACT / VITE
// ============================================================
// Работает только в Development.
//
// API:
//     WarehouseManager.API
//
// Web:
//     ../WarehouseManager.Web
//
// Поэтому код работает независимо от того,
// находится проект на диске C:, D: или E:.
// ============================================================

if (app.Environment.IsDevelopment())
{
    await StartWebFrontendAsync(
        app.Environment.ContentRootPath);
}


// ============================================================
// EXCEPTION HANDLING
// ============================================================

app.UseMiddleware<
    ExceptionHandlingMiddleware>();


// ============================================================
// SWAGGER
// ============================================================

app.UseSwagger();

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint(
        "/swagger/v1/swagger.json",
        "WarehouseManager API v1");

    options.DocumentTitle =
        "WarehouseManager API";
});


// ============================================================
// CORS
// ============================================================
// CORS должен находиться до Authentication / Authorization.
// ============================================================

app.UseCors("WarehouseManagerWeb");


// ============================================================
// AUTH
// ============================================================

app.UseAuthentication();

app.UseAuthorization();


// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();


// ============================================================
// RUN
// ============================================================

app.Run();


// ============================================================
// FRONTEND START HELPER
// ============================================================

static async Task StartWebFrontendAsync(
    string apiContentRootPath)
{
    const int vitePort = 5173;

    // Если Vite уже работает — второй экземпляр не запускаем.
    if (await IsPortOpenAsync(
            "127.0.0.1",
            vitePort))
    {
        Console.WriteLine(
            $"WarehouseManager.Web уже работает на http://localhost:{vitePort}");

        return;
    }

    var repositoryRoot =
        Path.GetFullPath(
            Path.Combine(
                apiContentRootPath,
                ".."));

    var webPath =
        Path.Combine(
            repositoryRoot,
            "WarehouseManager.Web");

    var packageJsonPath =
        Path.Combine(
            webPath,
            "package.json");

    if (!Directory.Exists(webPath))
    {
        Console.WriteLine(
            $"WarehouseManager.Web не найден: {webPath}");

        return;
    }

    if (!File.Exists(packageJsonPath))
    {
        Console.WriteLine(
            $"package.json не найден: {packageJsonPath}");

        return;
    }

    try
    {
        var startInfo =
            new ProcessStartInfo
            {
                FileName =
                    "cmd.exe",

                Arguments =
                    "/k npm run dev",

                WorkingDirectory =
                    webPath,

                UseShellExecute =
                    true,

                CreateNoWindow =
                    false
            };

        Process.Start(startInfo);

        Console.WriteLine(
            "============================================");

        Console.WriteLine(
            "WarehouseManager.Web запускается...");

        Console.WriteLine(
            $"Путь: {webPath}");

        Console.WriteLine(
            $"Web: http://localhost:{vitePort}");

        Console.WriteLine(
            "============================================");
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            "Не удалось автоматически запустить WarehouseManager.Web.");

        Console.WriteLine(
            ex.Message);
    }
}


// ============================================================
// PORT CHECK
// ============================================================

static async Task<bool> IsPortOpenAsync(
    string host,
    int port)
{
    try
    {
        using var client =
            new TcpClient();

        using var cancellation =
            new CancellationTokenSource(
                TimeSpan.FromMilliseconds(300));

        await client.ConnectAsync(
            host,
            port,
            cancellation.Token);

        return true;
    }
    catch
    {
        return false;
    }
}
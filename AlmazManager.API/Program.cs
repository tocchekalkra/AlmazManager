using System.Diagnostics;
using System.Net.Sockets;
using System.Security.Claims;
using System.Text;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using AlmazManager.API.Middlewares;

using AlmazManager.Application.Features.Authentication.Handlers;
using AlmazManager.Application.Features.Categories.Handlers;
using AlmazManager.Application.Features.Dashboard.Handlers;
using AlmazManager.Application.Features.Documents.Handlers;
using AlmazManager.Application.Features.Inventory.Handlers;
using AlmazManager.Application.Features.InventoryDocuments.Handlers;
using AlmazManager.Application.Features.Issue.Handlers;
using AlmazManager.Application.Features.Materials.Handlers;
using AlmazManager.Application.Features.Operations.Handlers;
using AlmazManager.Application.Features.Receiving.Handlers;
using AlmazManager.Application.Features.Stocks.Handlers;
using AlmazManager.Application.Features.Users.Handlers;

using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Options;

using AlmazManager.Domain.Interfaces;

using AlmazManager.Infrastructure.Database;
using AlmazManager.Infrastructure.Identity;
using AlmazManager.Infrastructure.Repositories;


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
        "РќР°СЃС‚СЂРѕР№РєРё JWT РЅРµ РЅР°Р№РґРµРЅС‹.");

if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey) ||
    jwtOptions.SecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "РЎРµРєСЂРµС‚РЅС‹Р№ РєР»СЋС‡ JWT РґРѕР»Р¶РµРЅ СЃРѕРґРµСЂР¶Р°С‚СЊ РјРёРЅРёРјСѓРј 32 СЃРёРјРІРѕР»Р°.");
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
// Р Р°Р·СЂРµС€Р°РµРј Р»РѕРєР°Р»СЊРЅРѕРјСѓ React/Vite РѕР±СЂР°С‰Р°С‚СЊСЃСЏ Рє API.
// РџРѕР·Р¶Рµ, РєРѕРіРґР° РїСЂРёР»РѕР¶РµРЅРёРµ Р±СѓРґРµС‚ СЂР°Р·РјРµС‰РµРЅРѕ РЅР° СЃРµСЂРІРµСЂРµ,
// Р·Р°РјРµРЅРёРј localhost РЅР° СЂРµР°Р»СЊРЅС‹Р№ Р°РґСЂРµСЃ frontend.
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AlmazManagerWeb",
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
// РЎС‚Р°СЂС‹Р№ API РїРѕРєР° РѕСЃС‚Р°РІР»СЏРµРј РґР»СЏ СЃРѕРІРјРµСЃС‚РёРјРѕСЃС‚Рё.
// РџРѕР·Р¶Рµ РѕРїРµСЂР°С†РёРё РѕРєРѕРЅС‡Р°С‚РµР»СЊРЅРѕ Р±СѓРґСѓС‚ РёРґС‚Рё С‡РµСЂРµР· РґРѕРєСѓРјРµРЅС‚С‹.
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
            Title = "AlmazManager API",
            Version = "v1",
            Description =
                "API СЃРёСЃС‚РµРјС‹ СЃРєР»Р°РґСЃРєРѕРіРѕ СѓС‡РµС‚Р° AlmazManager"
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
                "Р’СЃС‚Р°РІСЊС‚Рµ JWT-С‚РѕРєРµРЅ Р±РµР· СЃР»РѕРІР° Bearer."
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
// Р Р°Р±РѕС‚Р°РµС‚ С‚РѕР»СЊРєРѕ РІ Development.
//
// API:
//     AlmazManager.API
//
// Web:
//     ../AlmazManager.Web
//
// РџРѕСЌС‚РѕРјСѓ РєРѕРґ СЂР°Р±РѕС‚Р°РµС‚ РЅРµР·Р°РІРёСЃРёРјРѕ РѕС‚ С‚РѕРіРѕ,
// РЅР°С…РѕРґРёС‚СЃСЏ РїСЂРѕРµРєС‚ РЅР° РґРёСЃРєРµ C:, D: РёР»Рё E:.
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
        "AlmazManager API v1");

    options.DocumentTitle =
        "AlmazManager API";
});


// ============================================================
// CORS
// ============================================================
// CORS РґРѕР»Р¶РµРЅ РЅР°С…РѕРґРёС‚СЊСЃСЏ РґРѕ Authentication / Authorization.
// ============================================================

app.UseCors("AlmazManagerWeb");


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

    // Р•СЃР»Рё Vite СѓР¶Рµ СЂР°Р±РѕС‚Р°РµС‚ вЂ” РІС‚РѕСЂРѕР№ СЌРєР·РµРјРїР»СЏСЂ РЅРµ Р·Р°РїСѓСЃРєР°РµРј.
    if (await IsPortOpenAsync(
            "127.0.0.1",
            vitePort))
    {
        Console.WriteLine(
            $"AlmazManager.Web СѓР¶Рµ СЂР°Р±РѕС‚Р°РµС‚ РЅР° http://localhost:{vitePort}");

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
            "AlmazManager.Web");

    var packageJsonPath =
        Path.Combine(
            webPath,
            "package.json");

    if (!Directory.Exists(webPath))
    {
        Console.WriteLine(
            $"AlmazManager.Web РЅРµ РЅР°Р№РґРµРЅ: {webPath}");

        return;
    }

    if (!File.Exists(packageJsonPath))
    {
        Console.WriteLine(
            $"package.json РЅРµ РЅР°Р№РґРµРЅ: {packageJsonPath}");

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
            "AlmazManager.Web Р·Р°РїСѓСЃРєР°РµС‚СЃСЏ...");

        Console.WriteLine(
            $"РџСѓС‚СЊ: {webPath}");

        Console.WriteLine(
            $"Web: http://localhost:{vitePort}");

        Console.WriteLine(
            "============================================");
    }
    catch (Exception ex)
    {
        Console.WriteLine(
            "РќРµ СѓРґР°Р»РѕСЃСЊ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё Р·Р°РїСѓСЃС‚РёС‚СЊ AlmazManager.Web.");

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

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
<<<<<<< HEAD
using WarehouseManager.Application.Features.Inventory.Handlers;
=======
using WarehouseManager.Application.Features.Documents.Handlers;
using WarehouseManager.Application.Features.Inventory.Handlers;
using WarehouseManager.Application.Features.InventoryDocuments.Handlers;
>>>>>>> c287b0f (Update 07.08.26 14:30)
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

var builder = WebApplication.CreateBuilder(args);

<<<<<<< HEAD
=======
// ============================================================
// CONFIGURATION
// ============================================================

>>>>>>> c287b0f (Update 07.08.26 14:30)
builder.Configuration.AddJsonFile(
    "jwtsettings.json",
    optional: false,
    reloadOnChange: true);

<<<<<<< HEAD
=======
// ============================================================
// JWT SETTINGS
// ============================================================

>>>>>>> c287b0f (Update 07.08.26 14:30)
var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "Настройки JWT не найдены.");

<<<<<<< HEAD
if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey)
    || jwtOptions.SecretKey.Length < 32)
=======
if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey) ||
    jwtOptions.SecretKey.Length < 32)
>>>>>>> c287b0f (Update 07.08.26 14:30)
{
    throw new InvalidOperationException(
        "Секретный ключ JWT должен содержать минимум 32 символа.");
}

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(
        JwtOptions.SectionName));

<<<<<<< HEAD
builder.Services.AddDbContext<WarehouseDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")));
=======
// ============================================================
// DATABASE
// ============================================================

builder.Services.AddDbContext<WarehouseDbContext>(
    options =>
        options.UseNpgsql(
            builder.Configuration.GetConnectionString(
                "DefaultConnection")));

// ============================================================
// AUTHENTICATION
// ============================================================
>>>>>>> c287b0f (Update 07.08.26 14:30)

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
<<<<<<< HEAD
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        jwtOptions.SecretKey)),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),

                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
=======
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
>>>>>>> c287b0f (Update 07.08.26 14:30)
            };
    });

builder.Services.AddAuthorization();

<<<<<<< HEAD
builder.Services.AddScoped<IMaterialRepository, MaterialRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IStockRepository, StockRepository>();
builder.Services.AddScoped<IOperationRepository, OperationRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();

builder.Services.AddScoped<IPasswordService, PasswordService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

builder.Services.AddScoped<LoginUserHandler>();

builder.Services.AddScoped<CreateMaterialHandler>();
builder.Services.AddScoped<GetMaterialsHandler>();
builder.Services.AddScoped<GetMaterialCatalogHandler>();
builder.Services.AddScoped<GetMaterialByIdHandler>();
builder.Services.AddScoped<UpdateMaterialHandler>();
builder.Services.AddScoped<SetMaterialActivityHandler>();

builder.Services.AddScoped<CreateCategoryHandler>();
builder.Services.AddScoped<GetCategoriesHandler>();
builder.Services.AddScoped<GetCategoryByIdHandler>();
builder.Services.AddScoped<UpdateCategoryHandler>();
builder.Services.AddScoped<SetCategoryActivityHandler>();

builder.Services.AddScoped<GetStocksHandler>();
builder.Services.AddScoped<GetStockCatalogHandler>();

builder.Services.AddScoped<GetOperationsHandler>();
builder.Services.AddScoped<GetOperationCatalogHandler>();

builder.Services.AddScoped<ReceiveMaterialHandler>();
builder.Services.AddScoped<IssueMaterialHandler>();

builder.Services.AddScoped<InventoryAdjustmentHandler>();
builder.Services.AddScoped<BulkInventoryHandler>();

builder.Services.AddScoped<GetDashboardHandler>();

builder.Services.AddScoped<RegisterUserHandler>();
builder.Services.AddScoped<GetUsersHandler>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

=======
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
// OLD RECEIVING / ISSUE HANDLERS
// ============================================================
// Пока оставляем для обратной совместимости.
// Позже полностью переведём движения на документы.

builder.Services.AddScoped<ReceiveMaterialHandler>();

builder.Services.AddScoped<IssueMaterialHandler>();

// ============================================================
// OLD INVENTORY HANDLERS
// ============================================================
// Пока не удаляем старый API инвентаризации.

builder.Services.AddScoped<InventoryAdjustmentHandler>();

builder.Services.AddScoped<BulkInventoryHandler>();

// ============================================================
// NEW INVENTORY DOCUMENT HANDLERS
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
// DASHBOARD
// ============================================================

builder.Services.AddScoped<GetDashboardHandler>();

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
// CONTROLLERS
// ============================================================

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();

// ============================================================
// SWAGGER
// ============================================================

>>>>>>> c287b0f (Update 07.08.26 14:30)
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "WarehouseManager API",
<<<<<<< HEAD
            Version = "v1"
=======
            Version = "v1",
            Description =
                "API системы складского учета WarehouseManager"
>>>>>>> c287b0f (Update 07.08.26 14:30)
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
<<<<<<< HEAD
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Вставьте JWT-токен без слова Bearer."
=======

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
>>>>>>> c287b0f (Update 07.08.26 14:30)
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
<<<<<<< HEAD
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
=======
                    Reference =
                        new OpenApiReference
                        {
                            Type =
                                ReferenceType.SecurityScheme,

                            Id =
                                "Bearer"
                        }
                },

>>>>>>> c287b0f (Update 07.08.26 14:30)
                Array.Empty<string>()
            }
        });
});
<<<<<<< HEAD

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();
=======

// ============================================================
// APPLICATION
// ============================================================

var app = builder.Build();

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
// AUTH
// ============================================================

app.UseAuthentication();
>>>>>>> c287b0f (Update 07.08.26 14:30)

app.UseAuthentication();
app.UseAuthorization();

// ============================================================
// CONTROLLERS
// ============================================================

app.MapControllers();

<<<<<<< HEAD
=======
// ============================================================
// RUN
// ============================================================

>>>>>>> c287b0f (Update 07.08.26 14:30)
app.Run();
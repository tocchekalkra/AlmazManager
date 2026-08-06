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
using WarehouseManager.Application.Features.Inventory.Handlers;
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

builder.Configuration.AddJsonFile(
    "jwtsettings.json",
    optional: false,
    reloadOnChange: true);

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>()
    ?? throw new InvalidOperationException(
        "Настройки JWT не найдены.");

if (string.IsNullOrWhiteSpace(jwtOptions.SecretKey)
    || jwtOptions.SecretKey.Length < 32)
{
    throw new InvalidOperationException(
        "Секретный ключ JWT должен содержать минимум 32 символа.");
}

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(
        JwtOptions.SectionName));

builder.Services.AddDbContext<WarehouseDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")));

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
                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(
                        jwtOptions.SecretKey)),

                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromSeconds(30),

                NameClaimType = ClaimTypes.Name,
                RoleClaimType = ClaimTypes.Role
            };
    });

builder.Services.AddAuthorization();

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

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "WarehouseManager API",
            Version = "v1"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Вставьте JWT-токен без слова Bearer."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
using Microsoft.EntityFrameworkCore;
using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Infrastructure.Database;

public sealed class WarehouseDbContext : DbContext
{
    public WarehouseDbContext(
        DbContextOptions<WarehouseDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Material> Materials => Set<Material>();

    public DbSet<Operation> Operations => Set<Operation>();

    public DbSet<Stock> Stocks => Set<Stock>();

    public DbSet<AppUser> Users => Set<AppUser>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(WarehouseDbContext).Assembly);
    }
}
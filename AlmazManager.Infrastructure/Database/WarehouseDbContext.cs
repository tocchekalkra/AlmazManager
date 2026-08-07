using Microsoft.EntityFrameworkCore;
using AlmazManager.Domain.Entities;

namespace AlmazManager.Infrastructure.Database;

public sealed class WarehouseDbContext : DbContext
{
    public WarehouseDbContext(
        DbContextOptions<WarehouseDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories =>
        Set<Category>();

    public DbSet<Material> Materials =>
        Set<Material>();

    public DbSet<Operation> Operations =>
        Set<Operation>();

    public DbSet<Stock> Stocks =>
        Set<Stock>();

    public DbSet<AppUser> Users =>
        Set<AppUser>();

    public DbSet<WarehouseDocument> WarehouseDocuments =>
        Set<WarehouseDocument>();

    public DbSet<WarehouseDocumentItem> WarehouseDocumentItems =>
        Set<WarehouseDocumentItem>();

    public DbSet<InventoryDocument> InventoryDocuments =>
        Set<InventoryDocument>();

    public DbSet<InventoryDocumentItem> InventoryDocumentItems =>
        Set<InventoryDocumentItem>();

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(WarehouseDbContext).Assembly);
    }
}

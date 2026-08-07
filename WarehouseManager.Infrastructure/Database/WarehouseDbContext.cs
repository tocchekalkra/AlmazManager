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

    public DbSet<Category> Categories =>
        Set<Category>();

    public DbSet<Material> Materials =>
        Set<Material>();

    public DbSet<Operation> Operations =>
        Set<Operation>();

    public DbSet<Stock> Stocks =>
        Set<Stock>();

<<<<<<< HEAD
    public DbSet<AppUser> Users => Set<AppUser>();
=======
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
>>>>>>> c287b0f (Update 07.08.26 14:30)

    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(WarehouseDbContext).Assembly);
    }
}
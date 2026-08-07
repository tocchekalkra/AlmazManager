using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Infrastructure.Configurations;

public sealed class InventoryDocumentConfiguration :
    IEntityTypeConfiguration<InventoryDocument>
{
    public void Configure(
        EntityTypeBuilder<InventoryDocument> builder)
    {
        builder.ToTable("InventoryDocuments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Number)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.Number)
            .IsUnique();

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.Comment)
            .HasMaxLength(1000);

        builder.Property(x => x.Status)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(x => x.InventoryDocumentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
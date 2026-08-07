using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Infrastructure.Configurations;

public sealed class WarehouseDocumentItemConfiguration :
    IEntityTypeConfiguration<WarehouseDocumentItem>
{
    public void Configure(
        EntityTypeBuilder<WarehouseDocumentItem> builder)
    {
        builder.ToTable("WarehouseDocumentItems");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.DocumentId)
            .IsRequired();

        builder.Property(x => x.MaterialId)
            .IsRequired();

        builder.Property(x => x.Quantity)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.DocumentId,
            x.MaterialId
        })
        .IsUnique();

        builder.HasOne<Material>()
            .WithMany()
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
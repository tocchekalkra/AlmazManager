using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AlmazManager.Domain.Entities;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class InventoryDocumentItemConfiguration :
    IEntityTypeConfiguration<InventoryDocumentItem>
{
    public void Configure(
        EntityTypeBuilder<InventoryDocumentItem> builder)
    {
        builder.ToTable("InventoryDocumentItems");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.InventoryDocumentId)
            .IsRequired();

        builder.Property(x => x.MaterialId)
            .IsRequired();

        builder.Property(x => x.ExpectedQuantity)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.ActualQuantity)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Ignore(x => x.Difference);

        builder.HasIndex(x => new
        {
            x.InventoryDocumentId,
            x.MaterialId
        })
        .IsUnique();

        builder.HasOne<Material>()
            .WithMany()
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

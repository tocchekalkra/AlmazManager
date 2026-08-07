using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AlmazManager.Domain.Entities;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class WarehouseDocumentConfiguration :
    IEntityTypeConfiguration<WarehouseDocument>
{
    public void Configure(
        EntityTypeBuilder<WarehouseDocument> builder)
    {
        builder.ToTable("WarehouseDocuments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Number)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.Number)
            .IsUnique();

        builder.Property(x => x.Type)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired();

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.Comment)
            .HasMaxLength(1000);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(x => x.DocumentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

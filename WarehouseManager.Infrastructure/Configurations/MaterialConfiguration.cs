using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Infrastructure.Configurations;

public sealed class MaterialConfiguration : IEntityTypeConfiguration<Material>
{
    public void Configure(EntityTypeBuilder<Material> builder)
    {
        builder.ToTable("Materials");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Article)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(x => x.Article)
            .IsUnique();

        builder.Property(x => x.CategoryId)
            .IsRequired();

        builder.Property(x => x.Unit)
            .IsRequired();

        builder.Property(x => x.MinimumQuantity)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.Barcode)
            .HasMaxLength(100);

        builder.HasIndex(x => x.Barcode)
            .IsUnique();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasOne<Category>()
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
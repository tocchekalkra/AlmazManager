using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Infrastructure.Configurations;

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.HasIndex(x => x.Name)
            .IsUnique();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();
    }
}
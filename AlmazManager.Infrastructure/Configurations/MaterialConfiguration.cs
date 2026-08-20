using AlmazManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class MaterialConfiguration :
    IEntityTypeConfiguration<Material>
{
    public void Configure(
        EntityTypeBuilder<Material> builder)
    {
        builder.ToTable("Materials");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(250);

        builder.Property(x => x.Article)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.CategoryId)
            .IsRequired();

        builder.Property(x => x.Unit)
            .IsRequired();

        builder.Property(x => x.MinimumQuantity)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.Kind)
            .IsRequired();

        builder.Property(x => x.WidthMeters)
            .HasPrecision(10, 3)
            .IsRequired(false);

        builder.Property(x => x.ColorCode)
            .HasMaxLength(20)
            .IsRequired(false);

        builder.Property(x => x.ColorName)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(x => x.ColorHex)
            .HasMaxLength(7)
            .IsRequired(false);

        builder.Property(x => x.MachineName)
            .HasMaxLength(150)
            .IsRequired(false);

        builder.Property(x => x.PackageLiters)
            .HasPrecision(5, 2)
            .IsRequired(false);

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.HasIndex(x => x.Article)
            .IsUnique();

        builder.HasIndex(x => x.Name);

        builder.HasIndex(x => x.CategoryId);

        builder.HasIndex(x => x.Kind);

        builder.HasIndex(x => new { x.Kind, x.MachineName, x.ColorName, x.PackageLiters });

        builder.HasIndex(x => new
        {
            x.Kind,
            x.ColorCode,
            x.WidthMeters
        });

        builder.HasOne<Category>()
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

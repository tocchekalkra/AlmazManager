using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WarehouseManager.Domain.Entities;

namespace WarehouseManager.Infrastructure.Configurations;

public sealed class OperationConfiguration :
    IEntityTypeConfiguration<Operation>
{
    public void Configure(
        EntityTypeBuilder<Operation> builder)
    {
        builder.ToTable("Operations");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.MaterialId)
            .IsRequired();

        builder.Property(x => x.Type)
            .IsRequired();

        builder.Property(x => x.Quantity)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.QuantityBefore)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.QuantityChange)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.QuantityAfter)
            .HasPrecision(18, 3)
            .IsRequired();

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.DocumentId)
            .IsRequired(false);

        builder.Property(x => x.IsReversal)
            .IsRequired();

        builder.Property(x => x.ReversedOperationId)
            .IsRequired(false);

        builder.Property(x => x.Comment)
            .HasMaxLength(2000);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(x => x.IsActive)
            .IsRequired();

        builder.HasIndex(x => x.MaterialId);

        builder.HasIndex(x => x.UserId);

        builder.HasIndex(x => x.DocumentId);

        builder.HasIndex(x => x.CreatedAtUtc);
    }
}
using AlmazManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class SupplyInvoiceItemConfiguration : IEntityTypeConfiguration<SupplyInvoiceItem>
{
    public void Configure(EntityTypeBuilder<SupplyInvoiceItem> builder)
    {
        builder.ToTable("SupplyInvoiceItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.SupplyInvoiceId).IsRequired();
        builder.Property(x => x.MaterialId).IsRequired();
        builder.Property(x => x.ExpectedQuantity).HasPrecision(18, 3).IsRequired();
        builder.Property(x => x.ReceivedQuantity).HasPrecision(18, 3).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.Ignore(x => x.RemainingQuantity);
        builder.HasIndex(x => new { x.SupplyInvoiceId, x.MaterialId }).IsUnique();
        builder.HasIndex(x => x.MaterialId);
        builder.HasOne<Material>()
            .WithMany()
            .HasForeignKey(x => x.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

using AlmazManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class SupplyInvoiceConfiguration : IEntityTypeConfiguration<SupplyInvoice>
{
    public void Configure(EntityTypeBuilder<SupplyInvoice> builder)
    {
        builder.ToTable("SupplyInvoices");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CreatedByUserId).IsRequired();
        builder.Property(x => x.Supplier).HasMaxLength(250).IsRequired();
        builder.Property(x => x.InvoiceNumber).HasMaxLength(100).IsRequired();
        builder.Property(x => x.InvoiceDate).HasColumnType("date").IsRequired();
        builder.Property(x => x.Amount).HasPrecision(18, 2).IsRequired();
        builder.Property(x => x.PaymentDueDate).HasColumnType("date").IsRequired(false);
        builder.Property(x => x.ExpectedDeliveryDate).HasColumnType("date").IsRequired(false);
        builder.Property(x => x.AttachmentPath).HasMaxLength(500).IsRequired(false);
        builder.Property(x => x.Comment).HasMaxLength(1000).IsRequired(false);
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.UpdatedAtUtc).IsRequired();
        builder.Property(x => x.CreatedAtUtc).IsRequired();
        builder.Property(x => x.IsActive).IsRequired();
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.ExpectedDeliveryDate);
        builder.HasIndex(x => x.PaymentDueDate);
        builder.HasIndex(x => new { x.Supplier, x.InvoiceNumber, x.InvoiceDate }).IsUnique();
        builder.HasMany(x => x.Items)
            .WithOne()
            .HasForeignKey(x => x.SupplyInvoiceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

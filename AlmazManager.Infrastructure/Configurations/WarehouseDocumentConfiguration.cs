using AlmazManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class WarehouseDocumentConfiguration :
    IEntityTypeConfiguration<WarehouseDocument>
{
    public void Configure(
        EntityTypeBuilder<WarehouseDocument> builder)
    {
        builder.ToTable(
            "WarehouseDocuments");

        builder.HasKey(
            x => x.Id);

        builder.Property(
                x => x.Number)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(
                x => x.Type)
            .IsRequired();

        builder.Property(
                x => x.Status)
            .IsRequired();

        builder.Property(
                x => x.UserId)
            .IsRequired();

        builder.Property(
                x => x.Supplier)
            .HasMaxLength(250)
            .IsRequired(false);

        builder.Property(
                x => x.ExternalNumber)
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(
                x => x.Comment)
            .HasMaxLength(1000)
            .IsRequired(false);

        builder.Property(
                x => x.CreatedAtUtc)
            .IsRequired();

        builder.Property(
                x => x.IsActive)
            .IsRequired();

        builder.Property(
                x => x.PostedAtUtc)
            .IsRequired(false);

        builder.Property(
                x => x.CancelledAtUtc)
            .IsRequired(false);

        builder.HasIndex(
                x => x.Number)
            .IsUnique();

        builder.HasIndex(
            x => x.Type);

        builder.HasIndex(
            x => x.Status);

        builder.HasIndex(
            x => x.UserId);

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(
                x => x.UserId)
            .OnDelete(
                DeleteBehavior.Restrict);

        builder.HasMany(
                x => x.Items)
            .WithOne()
            .HasForeignKey(
                x => x.DocumentId)
            .OnDelete(
                DeleteBehavior.Cascade);
    }
}
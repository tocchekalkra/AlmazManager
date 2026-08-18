using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AlmazManager.Domain.Entities;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class AppUserConfiguration :
    IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(user => user.Id);

        builder.Property(user => user.FullName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(user => user.Login)
            .IsRequired()
            .HasMaxLength(100);

        builder.HasIndex(user => user.Login)
            .IsUnique();

        builder.Property(user => user.PasswordHash)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(user => user.Role)
            .IsRequired();

        builder.Property(user => user.CanManageMaterials)
            .IsRequired();

        builder.Property(user => user.CanArchiveMaterials)
            .IsRequired();

        builder.Property(user => user.CanRestoreMaterials)
            .IsRequired();

        builder.Property(user => user.CanPermanentlyDeleteMaterials)
            .IsRequired();

        builder.Property(user => user.CanCancelDocuments)
            .IsRequired();

        builder.Property(user => user.CanManageSupplies)
            .IsRequired();

        builder.Property(user => user.CreatedAtUtc)
            .IsRequired();

        builder.Property(user => user.IsActive)
            .IsRequired();
    }
}

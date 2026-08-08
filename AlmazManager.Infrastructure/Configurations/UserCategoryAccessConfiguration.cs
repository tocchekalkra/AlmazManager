using AlmazManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlmazManager.Infrastructure.Database.Configurations;

public sealed class UserCategoryAccessConfiguration
    : IEntityTypeConfiguration<UserCategoryAccess>
{
    public void Configure(
        EntityTypeBuilder<UserCategoryAccess> builder)
    {
        builder.ToTable("UserCategoryAccesses");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.UserId)
            .IsRequired();

        builder.Property(x => x.CategoryId)
            .IsRequired();

        builder.Property(x => x.CanView)
            .IsRequired();

        builder.Property(x => x.CanReceive)
            .IsRequired();

        builder.Property(x => x.CanIssue)
            .IsRequired();

        builder.Property(x => x.CanInventory)
            .IsRequired();

        builder.HasIndex(x => new
        {
            x.UserId,
            x.CategoryId
        })
            .IsUnique();

        builder.HasOne<AppUser>()
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne<Category>()
            .WithMany()
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
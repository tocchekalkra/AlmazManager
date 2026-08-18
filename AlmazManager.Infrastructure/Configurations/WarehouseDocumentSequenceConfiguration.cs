using AlmazManager.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlmazManager.Infrastructure.Configurations;

public sealed class WarehouseDocumentSequenceConfiguration :
    IEntityTypeConfiguration<WarehouseDocumentSequence>
{
    public void Configure(EntityTypeBuilder<WarehouseDocumentSequence> builder)
    {
        builder.ToTable("WarehouseDocumentSequences");
        builder.HasKey(x => x.Type);
        builder.Property(x => x.Type).ValueGeneratedNever();
        builder.Property(x => x.LastNumber).IsRequired();
    }
}

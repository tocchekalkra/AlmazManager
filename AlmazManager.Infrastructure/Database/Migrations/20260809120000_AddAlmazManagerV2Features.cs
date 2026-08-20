using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlmazManager.Infrastructure.Database.Migrations;

[DbContext(typeof(WarehouseDbContext))]
[Migration("20260809120000_AddAlmazManagerV2Features")]
public partial class AddAlmazManagerV2Features : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "CanArchiveMaterials",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<bool>(
            name: "CanCancelDocuments",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<bool>(
            name: "CanManageMaterials",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<bool>(
            name: "CanManageSupplies",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<bool>(
            name: "CanPermanentlyDeleteMaterials",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<bool>(
            name: "CanRestoreMaterials",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        migrationBuilder.AddColumn<DateOnly>(
            name: "DocumentDate",
            table: "WarehouseDocuments",
            type: "date",
            nullable: false,
            defaultValueSql: "CURRENT_DATE");

        migrationBuilder.Sql(
            "UPDATE \"WarehouseDocuments\" SET \"DocumentDate\" = \"CreatedAtUtc\"::date;");

        migrationBuilder.AddColumn<string>(
            name: "Recipient",
            table: "WarehouseDocuments",
            type: "character varying(250)",
            maxLength: 250,
            nullable: true);

        migrationBuilder.AddColumn<int>(
            name: "SequenceNumber",
            table: "WarehouseDocuments",
            type: "integer",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "SupplyInvoiceId",
            table: "WarehouseDocuments",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "AuditEvents",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Action = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                EntityType = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                EntityId = table.Column<Guid>(type: "uuid", nullable: false),
                MaterialId = table.Column<Guid>(type: "uuid", nullable: true),
                DocumentId = table.Column<Guid>(type: "uuid", nullable: true),
                Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_AuditEvents", x => x.Id));

        migrationBuilder.CreateTable(
            name: "SupplyInvoices",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                Supplier = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                InvoiceNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                InvoiceDate = table.Column<DateOnly>(type: "date", nullable: false),
                Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                PaymentDueDate = table.Column<DateOnly>(type: "date", nullable: true),
                ExpectedDeliveryDate = table.Column<DateOnly>(type: "date", nullable: true),
                AttachmentPath = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                Comment = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                Status = table.Column<int>(type: "integer", nullable: false),
                UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_SupplyInvoices", x => x.Id));

        migrationBuilder.CreateTable(
            name: "UserPreferences",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Theme = table.Column<int>(type: "integer", nullable: false),
                MaterialOrderJson = table.Column<string>(type: "jsonb", nullable: false),
                CategoryOrderJson = table.Column<string>(type: "jsonb", nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_UserPreferences", x => x.Id);
                table.ForeignKey(
                    name: "FK_UserPreferences_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "WarehouseDocumentSequences",
            columns: table => new
            {
                Type = table.Column<int>(type: "integer", nullable: false),
                LastNumber = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_WarehouseDocumentSequences", x => x.Type));

        migrationBuilder.CreateTable(
            name: "Notifications",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Type = table.Column<int>(type: "integer", nullable: false),
                Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                Message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                MaterialId = table.Column<Guid>(type: "uuid", nullable: true),
                SupplyInvoiceId = table.Column<Guid>(type: "uuid", nullable: true),
                DeduplicationKey = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                ReadAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                ResolvedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_Notifications", x => x.Id);
                table.ForeignKey(
                    name: "FK_Notifications_Users_UserId",
                    column: x => x.UserId,
                    principalTable: "Users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateTable(
            name: "SupplyInvoiceItems",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                SupplyInvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                MaterialId = table.Column<Guid>(type: "uuid", nullable: false),
                ExpectedQuantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                ReceivedQuantity = table.Column<decimal>(type: "numeric(18,3)", precision: 18, scale: 3, nullable: false),
                CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_SupplyInvoiceItems", x => x.Id);
                table.ForeignKey(
                    name: "FK_SupplyInvoiceItems_Materials_MaterialId",
                    column: x => x.MaterialId,
                    principalTable: "Materials",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_SupplyInvoiceItems_SupplyInvoices_SupplyInvoiceId",
                    column: x => x.SupplyInvoiceId,
                    principalTable: "SupplyInvoices",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex("IX_AuditEvents_CreatedAtUtc", "AuditEvents", "CreatedAtUtc");
        migrationBuilder.CreateIndex("IX_AuditEvents_DocumentId", "AuditEvents", "DocumentId");
        migrationBuilder.CreateIndex("IX_AuditEvents_MaterialId", "AuditEvents", "MaterialId");
        migrationBuilder.CreateIndex("IX_AuditEvents_UserId", "AuditEvents", "UserId");
        migrationBuilder.CreateIndex("IX_Notifications_UserId_ReadAtUtc", "Notifications", new[] { "UserId", "ReadAtUtc" });
        migrationBuilder.CreateIndex("IX_Notifications_UserId_DeduplicationKey_ResolvedAtUtc", "Notifications", new[] { "UserId", "DeduplicationKey", "ResolvedAtUtc" });
        migrationBuilder.CreateIndex("IX_SupplyInvoiceItems_MaterialId", "SupplyInvoiceItems", "MaterialId");
        migrationBuilder.CreateIndex("IX_SupplyInvoiceItems_SupplyInvoiceId_MaterialId", "SupplyInvoiceItems", new[] { "SupplyInvoiceId", "MaterialId" }, unique: true);
        migrationBuilder.CreateIndex("IX_SupplyInvoices_ExpectedDeliveryDate", "SupplyInvoices", "ExpectedDeliveryDate");
        migrationBuilder.CreateIndex("IX_SupplyInvoices_PaymentDueDate", "SupplyInvoices", "PaymentDueDate");
        migrationBuilder.CreateIndex("IX_SupplyInvoices_Status", "SupplyInvoices", "Status");
        migrationBuilder.CreateIndex("IX_SupplyInvoices_Supplier_InvoiceNumber_InvoiceDate", "SupplyInvoices", new[] { "Supplier", "InvoiceNumber", "InvoiceDate" }, unique: true);
        migrationBuilder.CreateIndex("IX_UserPreferences_UserId", "UserPreferences", "UserId", unique: true);
        migrationBuilder.CreateIndex("IX_WarehouseDocuments_SupplyInvoiceId", "WarehouseDocuments", "SupplyInvoiceId");
        migrationBuilder.CreateIndex(
            name: "IX_WarehouseDocuments_Type_SequenceNumber",
            table: "WarehouseDocuments",
            columns: new[] { "Type", "SequenceNumber" },
            unique: true,
            filter: "\"SequenceNumber\" IS NOT NULL");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable("AuditEvents");
        migrationBuilder.DropTable("Notifications");
        migrationBuilder.DropTable("SupplyInvoiceItems");
        migrationBuilder.DropTable("UserPreferences");
        migrationBuilder.DropTable("WarehouseDocumentSequences");
        migrationBuilder.DropTable("SupplyInvoices");

        migrationBuilder.DropIndex("IX_WarehouseDocuments_SupplyInvoiceId", "WarehouseDocuments");
        migrationBuilder.DropIndex("IX_WarehouseDocuments_Type_SequenceNumber", "WarehouseDocuments");

        migrationBuilder.DropColumn("DocumentDate", "WarehouseDocuments");
        migrationBuilder.DropColumn("Recipient", "WarehouseDocuments");
        migrationBuilder.DropColumn("SequenceNumber", "WarehouseDocuments");
        migrationBuilder.DropColumn("SupplyInvoiceId", "WarehouseDocuments");

        migrationBuilder.DropColumn("CanArchiveMaterials", "Users");
        migrationBuilder.DropColumn("CanCancelDocuments", "Users");
        migrationBuilder.DropColumn("CanManageMaterials", "Users");
        migrationBuilder.DropColumn("CanManageSupplies", "Users");
        migrationBuilder.DropColumn("CanPermanentlyDeleteMaterials", "Users");
        migrationBuilder.DropColumn("CanRestoreMaterials", "Users");
    }
}

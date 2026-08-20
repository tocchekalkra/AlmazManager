using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlmazManager.Infrastructure.Database.Migrations;

[DbContext(typeof(WarehouseDbContext))]
[Migration("20260820100000_AddInkMaterials")]
public sealed class AddInkMaterials : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "MachineName",
            table: "Materials",
            type: "character varying(150)",
            maxLength: 150,
            nullable: true);

        migrationBuilder.AddColumn<decimal>(
            name: "PackageLiters",
            table: "Materials",
            type: "numeric(5,2)",
            precision: 5,
            scale: 2,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Materials_Kind_MachineName_ColorName_PackageLiters",
            table: "Materials",
            columns: new[] { "Kind", "MachineName", "ColorName", "PackageLiters" });

        migrationBuilder.Sql("""
            INSERT INTO "Categories" ("Id", "Name", "IsActive", "CreatedAtUtc")
            SELECT gen_random_uuid(), 'Краска', TRUE, NOW()
            WHERE NOT EXISTS (
                SELECT 1 FROM "Categories" WHERE LOWER("Name") = LOWER('Краска')
            );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Materials_Kind_MachineName_ColorName_PackageLiters",
            table: "Materials");

        migrationBuilder.DropColumn(name: "MachineName", table: "Materials");
        migrationBuilder.DropColumn(name: "PackageLiters", table: "Materials");
    }
}

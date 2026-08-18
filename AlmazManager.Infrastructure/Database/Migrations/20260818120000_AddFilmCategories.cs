using AlmazManager.Infrastructure.Database;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlmazManager.Infrastructure.Database.Migrations;

[DbContext(typeof(WarehouseDbContext))]
[Migration("20260818120000_AddFilmCategories")]
public partial class AddFilmCategories : Migration
{
    private static readonly string[] CategoryIds =
    [
        "f1100000-0000-0000-0000-000000000001",
        "f1100000-0000-0000-0000-000000000002",
        "f1100000-0000-0000-0000-000000000003",
        "f1100000-0000-0000-0000-000000000004"
    ];

    protected override void Up(MigrationBuilder migrationBuilder)
    {
        InsertCategory(
            migrationBuilder,
            CategoryIds[0],
            "Плёнки - белые матовые");

        InsertCategory(
            migrationBuilder,
            CategoryIds[1],
            "Плёнки - белые глянцевые");

        InsertCategory(
            migrationBuilder,
            CategoryIds[2],
            "Плёнки - прозрачные матовые");

        InsertCategory(
            migrationBuilder,
            CategoryIds[3],
            "Плёнки - прозрачные глянцевые");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql(
            $"""
            DELETE FROM "Categories"
            WHERE "Id" IN (
                '{CategoryIds[0]}'::uuid,
                '{CategoryIds[1]}'::uuid,
                '{CategoryIds[2]}'::uuid,
                '{CategoryIds[3]}'::uuid)
              AND NOT EXISTS (
                  SELECT 1
                  FROM "Materials"
                  WHERE "Materials"."CategoryId" = "Categories"."Id");
            """);
    }

    private static void InsertCategory(
        MigrationBuilder migrationBuilder,
        string id,
        string name)
    {
        var escapedName = name.Replace("'", "''");

        migrationBuilder.Sql(
            $"""
            INSERT INTO "Categories" (
                "Id", "Name", "CreatedAtUtc", "IsActive")
            SELECT
                '{id}'::uuid,
                '{escapedName}',
                NOW(),
                TRUE
            WHERE NOT EXISTS (
                SELECT 1
                FROM "Categories"
                WHERE LOWER("Name") = LOWER('{escapedName}'));
            """);
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlmazManager.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddMaterialKindsAndOracalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ColorCode",
                table: "Materials",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ColorHex",
                table: "Materials",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ColorName",
                table: "Materials",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Kind",
                table: "Materials",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "WidthMeters",
                table: "Materials",
                type: "numeric(10,3)",
                precision: 10,
                scale: 3,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Materials_Kind",
                table: "Materials",
                column: "Kind");

            migrationBuilder.CreateIndex(
                name: "IX_Materials_Kind_ColorCode_WidthMeters",
                table: "Materials",
                columns: new[] { "Kind", "ColorCode", "WidthMeters" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Materials_Kind",
                table: "Materials");

            migrationBuilder.DropIndex(
                name: "IX_Materials_Kind_ColorCode_WidthMeters",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "ColorCode",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "ColorHex",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "ColorName",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "WidthMeters",
                table: "Materials");
        }
    }
}

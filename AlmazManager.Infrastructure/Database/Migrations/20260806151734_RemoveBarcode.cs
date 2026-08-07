using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlmazManager.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBarcode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Materials_Barcode",
                table: "Materials");

            migrationBuilder.DropColumn(
                name: "Barcode",
                table: "Materials");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Barcode",
                table: "Materials",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Materials_Barcode",
                table: "Materials",
                column: "Barcode",
                unique: true);
        }
    }
}


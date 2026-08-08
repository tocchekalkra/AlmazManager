using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlmazManager.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddReceivingDocumentDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExternalNumber",
                table: "WarehouseDocuments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Supplier",
                table: "WarehouseDocuments",
                type: "character varying(250)",
                maxLength: 250,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseDocuments_Status",
                table: "WarehouseDocuments",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseDocuments_Type",
                table: "WarehouseDocuments",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_WarehouseDocuments_UserId",
                table: "WarehouseDocuments",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_WarehouseDocuments_Users_UserId",
                table: "WarehouseDocuments",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_WarehouseDocuments_Users_UserId",
                table: "WarehouseDocuments");

            migrationBuilder.DropIndex(
                name: "IX_WarehouseDocuments_Status",
                table: "WarehouseDocuments");

            migrationBuilder.DropIndex(
                name: "IX_WarehouseDocuments_Type",
                table: "WarehouseDocuments");

            migrationBuilder.DropIndex(
                name: "IX_WarehouseDocuments_UserId",
                table: "WarehouseDocuments");

            migrationBuilder.DropColumn(
                name: "ExternalNumber",
                table: "WarehouseDocuments");

            migrationBuilder.DropColumn(
                name: "Supplier",
                table: "WarehouseDocuments");
        }
    }
}

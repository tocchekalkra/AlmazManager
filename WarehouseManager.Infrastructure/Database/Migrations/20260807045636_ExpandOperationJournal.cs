using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WarehouseManager.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class ExpandOperationJournal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "Operations",
                type: "numeric(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                table: "Operations",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "text",
                oldNullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DocumentId",
                table: "Operations",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsReversal",
                table: "Operations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "QuantityAfter",
                table: "Operations",
                type: "numeric(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "QuantityBefore",
                table: "Operations",
                type: "numeric(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "QuantityChange",
                table: "Operations",
                type: "numeric(18,3)",
                precision: 18,
                scale: 3,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "ReversedOperationId",
                table: "Operations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Operations_CreatedAtUtc",
                table: "Operations",
                column: "CreatedAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_Operations_DocumentId",
                table: "Operations",
                column: "DocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Operations_MaterialId",
                table: "Operations",
                column: "MaterialId");

            migrationBuilder.CreateIndex(
                name: "IX_Operations_UserId",
                table: "Operations",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Operations_CreatedAtUtc",
                table: "Operations");

            migrationBuilder.DropIndex(
                name: "IX_Operations_DocumentId",
                table: "Operations");

            migrationBuilder.DropIndex(
                name: "IX_Operations_MaterialId",
                table: "Operations");

            migrationBuilder.DropIndex(
                name: "IX_Operations_UserId",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "DocumentId",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "IsReversal",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "QuantityAfter",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "QuantityBefore",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "QuantityChange",
                table: "Operations");

            migrationBuilder.DropColumn(
                name: "ReversedOperationId",
                table: "Operations");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "Operations",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,3)",
                oldPrecision: 18,
                oldScale: 3);

            migrationBuilder.AlterColumn<string>(
                name: "Comment",
                table: "Operations",
                type: "text",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000,
                oldNullable: true);
        }
    }
}

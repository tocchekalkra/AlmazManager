using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlmazManager.Infrastructure.Database.Migrations
{
    /// <inheritdoc />
    public partial class SplitInventoryPermissions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            /*
             * Старое право CanInventory
             * переименовываем в право
             * инвентаризации обычного склада.
             *
             * Благодаря RenameColumn старые
             * значения автоматически сохраняются.
             */
            migrationBuilder.RenameColumn(
                name: "CanInventory",
                table: "UserCategoryAccesses",
                newName: "CanInventoryStandard");

            /*
             * Добавляем отдельное право
             * для ORACAL.
             *
             * Сначала создаём его со значением false.
             */
            migrationBuilder.AddColumn<bool>(
                name: "CanInventoryOracal",
                table: "UserCategoryAccesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            /*
             * Переносим старые права:
             *
             * если пользователь раньше имел
             * CanInventory = true,
             * то после миграции он будет иметь:
             *
             * CanInventoryStandard = true
             * CanInventoryOracal = true
             *
             * Если права не было,
             * оба останутся false.
             */
            migrationBuilder.Sql(
                """
                UPDATE "UserCategoryAccesses"
                SET "CanInventoryOracal" = "CanInventoryStandard";
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            /*
             * При откате объединяем два права
             * обратно в одно.
             *
             * Если было разрешено хотя бы одно
             * из двух видов инвентаризации,
             * старое CanInventory будет true.
             */
            migrationBuilder.Sql(
                """
                UPDATE "UserCategoryAccesses"
                SET "CanInventoryStandard" =
                    "CanInventoryStandard" OR "CanInventoryOracal";
                """);

            migrationBuilder.DropColumn(
                name: "CanInventoryOracal",
                table: "UserCategoryAccesses");

            migrationBuilder.RenameColumn(
                name: "CanInventoryStandard",
                table: "UserCategoryAccesses",
                newName: "CanInventory");
        }
    }
}
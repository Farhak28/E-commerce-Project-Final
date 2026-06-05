using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Persistence.IdentityData.Migrations
{
    /// <inheritdoc />
    public partial class ReplaceAddressLabelWithName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Addresses_UserId_Label",
                table: "Addresses");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Addresses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE Addresses
                SET Name = CASE Label
                    WHEN 0 THEN 'Home'
                    WHEN 1 THEN 'Work'
                    WHEN 2 THEN 'Alternate'
                    ELSE 'Address'
                END
                WHERE Name IS NULL
                """
            );

            migrationBuilder.DropColumn(
                name: "Label",
                table: "Addresses");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Addresses",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "Address");

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_UserId",
                table: "Addresses",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Addresses_UserId",
                table: "Addresses");

            migrationBuilder.AddColumn<int>(
                name: "Label",
                table: "Addresses",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(
                """
                UPDATE Addresses
                SET Label = CASE
                    WHEN Name = 'Home' THEN 0
                    WHEN Name = 'Work' THEN 1
                    WHEN Name = 'Alternate' THEN 2
                    ELSE 0
                END
                """
            );

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Addresses");

            migrationBuilder.CreateIndex(
                name: "IX_Addresses_UserId_Label",
                table: "Addresses",
                columns: new[] { "UserId", "Label" },
                unique: true);
        }
    }
}

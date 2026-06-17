using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ECommerce.Persistence.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDeliveryScheduling : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DeliveryTimeSlotId",
                table: "Order",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveryType",
                table: "Order",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "EstimatedDeliveryDate",
                table: "Order",
                type: "datetimeoffset",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "ScheduledDeliveryDate",
                table: "Order",
                type: "date",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "BlockedDeliveryDate",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Reason = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BlockedDeliveryDate", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryHoliday",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryHoliday", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryPricingRule",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RuleType = table.Column<int>(type: "int", nullable: false),
                    Label = table.Column<string>(type: "nvarchar(120)", maxLength: 120, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(8,2)", nullable: false),
                    MinLeadHours = table.Column<int>(type: "int", nullable: true),
                    MaxLeadHours = table.Column<int>(type: "int", nullable: true),
                    MinLeadDays = table.Column<int>(type: "int", nullable: true),
                    WindowStartHour = table.Column<int>(type: "int", nullable: true),
                    WindowEndHour = table.Column<int>(type: "int", nullable: true),
                    DayOfWeek = table.Column<int>(type: "int", nullable: true),
                    PercentOfBaseCap = table.Column<decimal>(type: "decimal(5,4)", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryPricingRule", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeliverySchedulingSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MinLeadHours = table.Column<int>(type: "int", nullable: false),
                    MaxScheduleDaysAhead = table.Column<int>(type: "int", nullable: false),
                    SchedulingEnabled = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliverySchedulingSettings", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryTimeSlot",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Label = table.Column<string>(type: "nvarchar(80)", maxLength: 80, nullable: false),
                    StartTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    EndTime = table.Column<TimeOnly>(type: "time", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    SortOrder = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryTimeSlot", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Order_DeliveryTimeSlotId",
                table: "Order",
                column: "DeliveryTimeSlotId");

            migrationBuilder.CreateIndex(
                name: "IX_BlockedDeliveryDate_Date",
                table: "BlockedDeliveryDate",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryHoliday_Date",
                table: "DeliveryHoliday",
                column: "Date",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Order_DeliveryTimeSlot_DeliveryTimeSlotId",
                table: "Order",
                column: "DeliveryTimeSlotId",
                principalTable: "DeliveryTimeSlot",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Order_DeliveryTimeSlot_DeliveryTimeSlotId",
                table: "Order");

            migrationBuilder.DropTable(
                name: "BlockedDeliveryDate");

            migrationBuilder.DropTable(
                name: "DeliveryHoliday");

            migrationBuilder.DropTable(
                name: "DeliveryPricingRule");

            migrationBuilder.DropTable(
                name: "DeliverySchedulingSettings");

            migrationBuilder.DropTable(
                name: "DeliveryTimeSlot");

            migrationBuilder.DropIndex(
                name: "IX_Order_DeliveryTimeSlotId",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "DeliveryTimeSlotId",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "DeliveryType",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "EstimatedDeliveryDate",
                table: "Order");

            migrationBuilder.DropColumn(
                name: "ScheduledDeliveryDate",
                table: "Order");
        }
    }
}

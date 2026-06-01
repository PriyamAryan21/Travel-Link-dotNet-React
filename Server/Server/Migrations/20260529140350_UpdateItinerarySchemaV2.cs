using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateItinerarySchemaV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "BudgetPerPersonPerDay",
                table: "ItineraryRequests",
                newName: "TotalBudget");

            migrationBuilder.AddColumn<decimal>(
                name: "DailyFuelCostPerVehicle",
                table: "ItineraryRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DailyRentalCostPerVehicle",
                table: "ItineraryRequests",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroupSize",
                table: "ItineraryRequests",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsRental",
                table: "ItineraryRequests",
                type: "bit",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VehicleCount",
                table: "ItineraryRequests",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VehicleType",
                table: "ItineraryRequests",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DailyFuelCostPerVehicle",
                table: "ItineraryRequests");

            migrationBuilder.DropColumn(
                name: "DailyRentalCostPerVehicle",
                table: "ItineraryRequests");

            migrationBuilder.DropColumn(
                name: "GroupSize",
                table: "ItineraryRequests");

            migrationBuilder.DropColumn(
                name: "IsRental",
                table: "ItineraryRequests");

            migrationBuilder.DropColumn(
                name: "VehicleCount",
                table: "ItineraryRequests");

            migrationBuilder.DropColumn(
                name: "VehicleType",
                table: "ItineraryRequests");

            migrationBuilder.RenameColumn(
                name: "TotalBudget",
                table: "ItineraryRequests",
                newName: "BudgetPerPersonPerDay");
        }
    }
}

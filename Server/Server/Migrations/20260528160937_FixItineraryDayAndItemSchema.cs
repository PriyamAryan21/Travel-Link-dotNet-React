using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class FixItineraryDayAndItemSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Time",
                table: "ItineraryItems",
                newName: "Type");

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "ItineraryItems",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "Date",
                table: "ItineraryDays",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "ItineraryItems");

            migrationBuilder.DropColumn(
                name: "Date",
                table: "ItineraryDays");

            migrationBuilder.RenameColumn(
                name: "Type",
                table: "ItineraryItems",
                newName: "Time");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Server.Migrations
{
    /// <inheritdoc />
    public partial class AddedItineraryModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ItineraryRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GroupId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Destination = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    BudgetPerPersonPerDay = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RegenerationNote = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItineraryRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItineraryRequests_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ItineraryRequests_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GeneratedItineraries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItineraryRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TotalDays = table.Column<int>(type: "int", nullable: false),
                    DroppedSuggestionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    GeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GeneratedItineraries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GeneratedItineraries_ItineraryRequests_ItineraryRequestId",
                        column: x => x.ItineraryRequestId,
                        principalTable: "ItineraryRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlaceSuggestions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItineraryRequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SuggestedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AdminApproved = table.Column<bool>(type: "bit", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaceSuggestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlaceSuggestions_ItineraryRequests_ItineraryRequestId",
                        column: x => x.ItineraryRequestId,
                        principalTable: "ItineraryRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaceSuggestions_Users_SuggestedByUserId",
                        column: x => x.SuggestedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ItineraryDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ItineraryId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayNumber = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WeatherNote = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItineraryDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItineraryDays_GeneratedItineraries_ItineraryId",
                        column: x => x.ItineraryId,
                        principalTable: "GeneratedItineraries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SuggestionVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SuggestionId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SuggestionVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SuggestionVotes_PlaceSuggestions_SuggestionId",
                        column: x => x.SuggestionId,
                        principalTable: "PlaceSuggestions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SuggestionVotes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ItineraryItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DayId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    OrderIndex = table.Column<int>(type: "int", nullable: false),
                    Time = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PlaceName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DurationMinutes = table.Column<int>(type: "int", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EstimatedCostPerPerson = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    BookingSearchQuery = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BookingType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ItineraryItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ItineraryItems_ItineraryDays_DayId",
                        column: x => x.DayId,
                        principalTable: "ItineraryDays",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GeneratedItineraries_ItineraryRequestId",
                table: "GeneratedItineraries",
                column: "ItineraryRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ItineraryDays_ItineraryId",
                table: "ItineraryDays",
                column: "ItineraryId");

            migrationBuilder.CreateIndex(
                name: "IX_ItineraryItems_DayId",
                table: "ItineraryItems",
                column: "DayId");

            migrationBuilder.CreateIndex(
                name: "IX_ItineraryRequests_CreatedByUserId",
                table: "ItineraryRequests",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ItineraryRequests_GroupId",
                table: "ItineraryRequests",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaceSuggestions_ItineraryRequestId",
                table: "PlaceSuggestions",
                column: "ItineraryRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaceSuggestions_SuggestedByUserId",
                table: "PlaceSuggestions",
                column: "SuggestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_SuggestionVotes_SuggestionId_UserId",
                table: "SuggestionVotes",
                columns: new[] { "SuggestionId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SuggestionVotes_UserId",
                table: "SuggestionVotes",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ItineraryItems");

            migrationBuilder.DropTable(
                name: "SuggestionVotes");

            migrationBuilder.DropTable(
                name: "ItineraryDays");

            migrationBuilder.DropTable(
                name: "PlaceSuggestions");

            migrationBuilder.DropTable(
                name: "GeneratedItineraries");

            migrationBuilder.DropTable(
                name: "ItineraryRequests");
        }
    }
}

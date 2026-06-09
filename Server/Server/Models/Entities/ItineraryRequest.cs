namespace Server.Models.Entities
{
    public class ItineraryRequest
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid TripId { get; set; }
        public Guid CreatedByUserId { get; set; }
        public decimal TotalBudget { get; set; }
        public int GroupSize { get; set; }
        public string? VehicleType { get; set; }
        public int? VehicleCount { get; set; }
        public bool? IsRental { get; set; }
        public decimal? DailyRentalCostPerVehicle { get; set; }
        public decimal? DailyFuelCostPerVehicle { get; set; }
        public decimal? DailyHotelCostPerRoom { get; set; }
        public int? NumberOfRooms { get; set; }
        public string Status { get; set; } = "Open";
        public string? RegenerationNote { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Trip Trip { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
        public ICollection<PlaceSuggestion> Suggestions { get; set; } = new List<PlaceSuggestion>();
        public GeneratedItinerary? GeneratedItinerary { get; set; } 
    }
}

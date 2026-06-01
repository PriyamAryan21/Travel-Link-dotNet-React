namespace Server.DTOs.Itinerary
{
    public class ItineraryResultDto
    {
        public Guid Id { get; set; }
        public Guid RequestId { get; set; }
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalDays { get; set; }
        public int GroupSize { get; set; }
        public DateTime GeneratedAt { get; set; }
        public decimal TotalBudget { get; set; }
        public decimal HotelTotalCost { get; set; }
        public decimal DailyHotelCost { get; set; }    // per night for whole group
        public int NumberOfNights { get; set; }
        public bool ReplacedExisting { get; set; }
        public decimal VehicleTotalCost { get; set; }
        public decimal EstimatedActivityCost { get; set; }
        public decimal EstimatedTotalSpend { get; set; }
        public decimal BudgetRemaining { get; set; }
        public decimal EstimatedCostPerPerson { get; set; }
        public string? VehicleType { get; set; }
        public int? VehicleCount { get; set; }
        public decimal DailyVehicleCost { get; set; }
        public List<ItineraryDayDto> Days { get; set; } = new();
        public List<DroppedSuggestionDto> DroppedSuggestions { get; set; } = new();
    }
}

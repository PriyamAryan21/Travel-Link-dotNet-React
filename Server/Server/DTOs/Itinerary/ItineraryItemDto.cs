namespace Server.DTOs.Itinerary
{
    public class ItineraryItemDto
    {
        public Guid Id { get; set; }
        public int OrderIndex { get; set; }
        public string Type { get; set; } = string.Empty;
        public string PlaceName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DurationMinutes { get; set; }
        public string Notes { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public decimal? EstimatedCostPerPerson { get; set; }
        public string? BookingSearchQuery { get; set; }
        public string? BookingType { get; set; }
        public bool IsCompleted { get; set; }
    }
}

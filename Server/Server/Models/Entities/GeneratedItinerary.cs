namespace Server.Models.Entities
{
    public class GeneratedItinerary
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ItineraryRequestId { get; set; }
        public int TotalDays { get; set; }
        public string? DroppedSuggestionsJson { get; set; } // JSON: [{name, reason}]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
        // Navigation
        public ItineraryRequest ItineraryRequest { get; set; } = null!;
        public ICollection<ItineraryDay> Days { get; set; } = new List<ItineraryDay>();
    }
}

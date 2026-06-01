namespace Server.Models.Entities
{
    public class ItineraryDay
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ItineraryId { get; set; }
        public int DayNumber { get; set; }
        public DateTime Date { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? WeatherNote { get; set; }
        public GeneratedItinerary Itinerary { get; set; } = null!;
        public ICollection<ItineraryItem> Items { get; set; } = new List<ItineraryItem>();
    }
}

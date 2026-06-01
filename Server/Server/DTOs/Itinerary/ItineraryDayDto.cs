namespace Server.DTOs.Itinerary
{
    public class ItineraryDayDto
    {
        public Guid Id { get; set; }
        public int DayNumber { get; set; }
        public DateTime Date { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? WeatherNote { get; set; }
        public List<ItineraryItemDto> Items { get; set; } = new();
    }
}

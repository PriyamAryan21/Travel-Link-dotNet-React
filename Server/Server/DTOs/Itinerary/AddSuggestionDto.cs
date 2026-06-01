namespace Server.DTOs.Itinerary
{
    public class AddSuggestionDto
    {
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "place";
        public string? Notes { get; set; }
    }
}

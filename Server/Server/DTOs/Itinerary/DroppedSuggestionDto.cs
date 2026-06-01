using System.Text.Json.Serialization;

namespace Server.DTOs.Itinerary
{
    public class DroppedSuggestionDto
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        [JsonPropertyName("reason")]
        public string Reason { get; set; } = string.Empty;
    }
}

namespace Server.DTOs.Itinerary
{
    public class GroupItineraryStatusDto
    {
        public Guid RequestId { get; set; }
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalBudget { get; set; }
        public string Status { get; set; } = string.Empty;  // Open | Generating | Generated
        public int TotalSuggestions { get; set; }
        public int ApprovedSuggestions { get; set; }
    }
}

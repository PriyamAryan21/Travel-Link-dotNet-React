using System;

namespace Server.DTOs.Itinerary
{
    public class UserItinerarySummaryDto
    {
        public Guid ItineraryId { get; set; }
        public Guid RequestId { get; set; }
        public Guid TripId { get; set; }
        public Guid GroupId { get; set; }
        public string GroupName { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? GeneratedAt { get; set; }
        public decimal TotalBudget { get; set; }
        public int TotalSuggestions { get; set; }
        public int ApprovedSuggestions { get; set; }
        public bool IsAdmin { get; set; }
    }
}

namespace Server.DTOs.Trip
{
    public class TripDto
    {
        public Guid Id { get; set; }
        public Guid GroupId { get; set; }
        public string GroupName { get; set; }
        public Guid CreatedByUserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? CoverImageUrl { get; set; }
        public bool HasItinerary { get; set; }
    }
}

namespace Server.Models.Entities
{
    public class Trip
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid GroupId { get; set; }
        public Guid CreatedByUserId { get; set; }
        public string Name { get; set; } = string.Empty; // e.g., "Summer Goa Trip"
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? CoverImageUrl { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public Group Group { get; set; } = null!;
        public User CreatedBy { get; set; } = null!;
        public ItineraryRequest? ItineraryRequest { get; set; }
    }
}

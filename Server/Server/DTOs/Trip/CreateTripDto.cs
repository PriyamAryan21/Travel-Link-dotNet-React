namespace Server.DTOs.Trip
{
    public class CreateTripDto
    {
        public Guid GroupId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? CoverImageUrl { get; set; }
    }
}

namespace Server.DTOs.Location
{
    public class LocationUpdateDto
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public double Lat { get; set; }
        public double Lng { get; set; }
        public double Accuracy { get; set; }
        public double? Speed { get; set; }
        public DateTime Timestamp { get; set; }
    }
}

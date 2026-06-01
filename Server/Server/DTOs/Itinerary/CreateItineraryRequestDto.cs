namespace Server.DTOs.Itinerary
{
    public class CreateItineraryRequestDto
    {
        public Guid GroupId { get; set; }
        public string Destination { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalBudget { get; set; }
        public decimal? DailyHotelCostPerRoom { get; set; }
        public int? NumberOfRooms { get; set; }
        public string? VehicleType { get; set; }
        public int? VehicleCount { get; set; }
        public bool? IsRental { get; set; }
        public decimal? DailyRentalCostPerVehicle { get; set; }
        public decimal? DailyFuelCostPerVehicle { get; set; }
    }
}

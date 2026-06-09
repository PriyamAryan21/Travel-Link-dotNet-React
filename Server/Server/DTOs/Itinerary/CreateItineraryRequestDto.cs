namespace Server.DTOs.Itinerary
{
    public class CreateItineraryRequestDto
    {
        public Guid TripId { get; set; }
        public decimal TotalBudget { get; set; }
        public decimal? DailyHotelCostPerRoom { get; set; }
        public int? NumberOfRooms { get; set; }
        public string? VehicleType { get; set; }
        public int? VehicleCount { get; set; }
        public bool? IsRental { get; set; }
        public decimal? DailyRentalCostPerVehicle { get; set; }
        public decimal? DailyFuelCostPerVehicle { get; set; }
        public string? Note { get; set; }
    }
}

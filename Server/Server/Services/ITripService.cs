using Server.Common;
using Server.DTOs.Trip;

namespace Server.Services
{
    public interface ITripService
    {
        Task<ServiceResult<Guid>> CreateTripAsync(Guid userId, CreateTripDto dto);
        Task<ServiceResult<List<TripDto>>> GetTripsByGroupAsync(Guid userId, Guid groupId);
        Task<ServiceResult<TripDto>> GetTripByIdAsync(Guid userId, Guid tripId);
        Task<ServiceResult<bool>> DeleteTripAsync(Guid userId, Guid tripId);
        Task<ServiceResult<List<TripDto>>> GetMyTripsAsync(Guid userId);
    }
}

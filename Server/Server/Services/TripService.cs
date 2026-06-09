using Microsoft.EntityFrameworkCore;
using Server.Common;
using Server.Data;
using Server.DTOs.Trip;
using Server.Models.Entities;

namespace Server.Services
{
    public class TripService : ITripService
    {
        private readonly AppDbContext _db;
        public TripService(AppDbContext db)
        {
            _db = db;
        }
        public async Task<ServiceResult<Guid>> CreateTripAsync(Guid userId, CreateTripDto dto)
        {
            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == dto.GroupId && m.UserId == userId && m.Role == "Admin");

            if (!isAdmin) return ServiceResult<Guid>.Fail("Only group admins can create a trip");

            if(dto.StartDate >= dto.EndDate) return ServiceResult<Guid>.Fail("Start date must be before end date");

            var trip = new Trip
            {
                GroupId = dto.GroupId,
                CreatedByUserId = userId,
                Name = dto.Name,
                Destination = dto.Destination,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                CoverImageUrl = dto.CoverImageUrl
            };

            _db.Trips.Add(trip);
            await _db.SaveChangesAsync();
            return ServiceResult<Guid>.Ok(trip.Id);
        }

        public async Task<ServiceResult<bool>> DeleteTripAsync(Guid userId, Guid tripId)
        {
            var trip = await _db.Trips.FindAsync(tripId);
            if(trip == null) return ServiceResult<bool>.Fail("Trip not found");

            var isAdmin = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == trip.GroupId && m.UserId == userId && m.Role == "Admin");

            if(!isAdmin) return ServiceResult<bool>.Fail("Only group admins can delete a trip");

            _db.Trips.Remove(trip);
            await _db.SaveChangesAsync();
            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<List<TripDto>>> GetMyTripsAsync(Guid userId)
        {
            var trips = await _db.Trips
                .Include(t => t.Group)
                .Include(t => t.ItineraryRequest)
                .Where(t => t.Group.Members.Any(m => m.UserId == userId))
                .OrderByDescending(t => t.StartDate)
                .Select(t => new TripDto
                {
                    Id = t.Id,
                    GroupId = t.GroupId,
                    CreatedByUserId = t.CreatedByUserId,
                    Name = t.Name,
                    Destination = t.Destination,
                    StartDate = t.StartDate,
                    EndDate = t.EndDate,
                    CoverImageUrl = t.CoverImageUrl,
                    HasItinerary = t.ItineraryRequest != null,
                    GroupName = t.Group.Name
                })
                .ToListAsync();
            return ServiceResult<List<TripDto>>.Ok(trips);
        }


        public async Task<ServiceResult<TripDto>> GetTripByIdAsync(Guid userId, Guid tripId)
        {
            var trip = await _db.Trips
                .Include(t => t.ItineraryRequest)
                .FirstOrDefaultAsync(t => t.Id == tripId);

            if(trip == null) return ServiceResult<TripDto>.Fail("Trip not found");

            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == trip.GroupId && m.UserId == userId);

            if(!isMember) return ServiceResult<TripDto>.Fail("Only group members can view this trip");


            return ServiceResult<TripDto>.Ok(new TripDto
            {
                Id = tripId,
                GroupId = trip.GroupId,
                CreatedByUserId = trip.CreatedByUserId,
                Name = trip.Name,
                Destination = trip.Destination,
                StartDate = trip.StartDate,
                EndDate = trip.EndDate,
                CoverImageUrl = trip.CoverImageUrl,
                HasItinerary = trip.ItineraryRequest != null
            });

        }

        public async Task<ServiceResult<List<TripDto>>> GetTripsByGroupAsync(Guid userId, Guid groupId)
        {
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId);

            if(!isMember) return ServiceResult<List<TripDto>>.Fail("Only group members can view trips");

            var trips = await _db.Trips
                .Include(t => t.ItineraryRequest)
                .Where(t => t.GroupId == groupId)
                .OrderBy(t=> t.StartDate)
                .Select(t => new TripDto
                {
                    Id = t.Id,
                    GroupId = t.GroupId,
                    CreatedByUserId = t.CreatedByUserId,
                    Name = t.Name,
                    Destination = t.Destination,
                    StartDate = t.StartDate,
                    EndDate = t.EndDate,
                    CoverImageUrl = t.CoverImageUrl,
                    HasItinerary = t.ItineraryRequest != null
                })
                .ToListAsync();

            return ServiceResult<List<TripDto>>.Ok(trips);
        }
    }
}

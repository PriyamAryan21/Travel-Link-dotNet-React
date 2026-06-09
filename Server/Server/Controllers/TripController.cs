using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs.Trip;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/trips")]
    [Authorize]
    public class TripController : ControllerBase
    {
        private readonly ITripService _tripService;

        public TripController(ITripService tripService)
        {
            _tripService = tripService;
        }
        private Guid GetCurrentUserId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyTrips()
        {
            var result = await _tripService.GetMyTripsAsync(GetCurrentUserId());
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateTrip([FromBody] CreateTripDto dto)
        {
            var result = await _tripService.CreateTripAsync(GetCurrentUserId(), dto);
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);

        }

        [HttpDelete("delete/{id}")]
        public async Task<IActionResult> DeleteTrip(Guid id)
        {
            var result = await _tripService.DeleteTripAsync(GetCurrentUserId(), id);
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("get/{id}")]
        public async Task<IActionResult> GetTripById(Guid id)
        {
            var result = await _tripService.GetTripByIdAsync(GetCurrentUserId(), id);
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }

        [HttpGet("getByGroup/{groupId}")]
        public async Task<IActionResult> GetTripsByGroup(Guid groupId)
        {
            var result = await _tripService.GetTripsByGroupAsync(GetCurrentUserId(), groupId);
            if (result.Success)
                return Ok(result);
            else
                return BadRequest(result);
        }
    }
}
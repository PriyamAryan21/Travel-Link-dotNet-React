using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Server.DTOs.Itinerary;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers
{
        [ApiController]
        [Route("api/itinerary")]
        [Authorize]
        
    public class ItineraryController : ControllerBase
    {
        private readonly IItineraryService _itineraryService;

        public ItineraryController(IItineraryService itineraryService)
        {
            _itineraryService = itineraryService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("request")]
        public async Task<IActionResult> CreateRequest([FromBody] CreateItineraryRequestDto dto)
        {
            var result = await _itineraryService.CreateRequestAsync(GetUserId(), dto);
            return result.Success ? Ok(result) : BadRequest(result.Message);
        }

        [HttpGet("{tripId:guid}/status")]
        public async Task<IActionResult> GetTripStatus(Guid tripId)
        {
            var result = await _itineraryService.GetTripItineraryStatusAsync(GetUserId(), tripId);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpDelete("request/{requestId:guid}")]
        public async Task<IActionResult> DeleteRequest(Guid requestId)
        {
            var result = await _itineraryService.DeleteItineraryRequestAsync(GetUserId(), requestId);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpPost("{requestId:guid}/suggest")]
        public async Task<IActionResult> AddSuggestion(Guid requestId, [FromBody] AddSuggestionDto dto)
        {
            var result = await _itineraryService.AddSuggestionAsync(GetUserId(), requestId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpDelete("suggestion/{suggestionId:guid}")]
        public async Task<IActionResult> DeleteSuggestion(Guid suggestionId)
        {
            var result = await _itineraryService.DeleteSuggestionAsync(GetUserId(), suggestionId);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpPost("suggestion/{suggestionId:guid}/vote")]
        public async Task<IActionResult> ToggleVote(Guid suggestionId)
        {
            var result = await _itineraryService.ToggleVoteAsync(GetUserId(), suggestionId);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpPatch("suggestion/{suggestionId:guid}/review")]
        public async Task<IActionResult> ReviewSuggestion(Guid suggestionId, [FromBody] ReviewSuggestionDto dto)
        {
            var result = await _itineraryService.ReviewSuggestionAsync(GetUserId(), suggestionId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("{requestId:guid}/suggestions")]
        public async Task<IActionResult> GetSuggestions(Guid requestId)
        {
            var result = await _itineraryService.GetSuggestionsAsync(GetUserId(), requestId);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpPost("{requestId:guid}/generate")]
        [EnableRateLimiting("ItineraryGenerationPolicy")]
        public async Task<IActionResult> Generate(Guid requestId, [FromBody] GenerateItineraryDto dto)
        {
            var result = await _itineraryService.GenerateItineraryAsync(GetUserId(), requestId, dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpPost("request/auto-generate")]
        [EnableRateLimiting("ItineraryGenerationPolicy")]
        public async Task<IActionResult> AutoGenerate([FromBody] AutoGenerateItineraryDto dto)
        {
            var result = await _itineraryService.AutoGenerateItineraryAsync(GetUserId(), dto);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpGet("{requestId:guid}/result")]
        public async Task<IActionResult> GetResult(Guid requestId)
        {
            var result = await _itineraryService.GetItineraryResultAsync(GetUserId(), requestId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("{requestId:guid}/result")]
        public async Task<IActionResult> DeleteResult(Guid requestId)
        {
            var result = await _itineraryService.DeleteGeneratedItineraryAsync(GetUserId(), requestId);
            return result.Success ? Ok(result) : BadRequest(result);
        }


        [HttpPatch("item/{itemId:guid}/complete")]
        public async Task<IActionResult> ToggleItemComplete(Guid itemId)
        {
            var result = await _itineraryService.ToggleItemCompleteAsync(GetUserId(), itemId);
            return result.Success ? Ok(result) : BadRequest(result);
        }

        [HttpGet("user")]
        public async Task<IActionResult> GetItinerariesByUser()
        {
            var result = await _itineraryService.GetItinerariesByUserAsync(GetUserId());
            return result.Success ? Ok(result) : BadRequest(result);
        }
    }
}

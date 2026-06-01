using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs.Friends;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FriendController : ControllerBase
    {
        private readonly IFriendService _friendService;
        public FriendController(IFriendService friendService)
        {
            _friendService = friendService;
        }

        private Guid GetCurrentUserId()
        {
            return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendRequest([FromBody] SendFriendRequestDto dto)
        {
            var (success, message) = await _friendService.SendRequestAsync(GetCurrentUserId(), dto);

            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        [HttpPost("respond/{requestId}")]
        public async Task<IActionResult> RespondToRequest(Guid requestId, [FromQuery] string action)
        {
            if (action != "accept" && action != "reject")
            {
                return BadRequest(new { message = "Invalid action. Use 'accept' or 'reject'." });
            }

            var (success, message) = await _friendService.RespondToRequestAsync(requestId, GetCurrentUserId(), action);

            return success ? Ok(new { message }) : BadRequest(new { message });
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var requests = await _friendService.GetPendingRequestsAsync(GetCurrentUserId());
            return Ok(requests);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetFriends()
        {
            var friends = await _friendService.GetFriendsAsync(GetCurrentUserId());
            return Ok(friends);
        }


        [HttpDelete("unfriend/{targetUserId:guid}")]
        public async Task<IActionResult> Unfriend(Guid targetUserId)
        {
            var result = await _friendService.UnfriendAsync(GetCurrentUserId(), targetUserId);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }
            return Ok(new { message = result.Message });
        }
    }
}

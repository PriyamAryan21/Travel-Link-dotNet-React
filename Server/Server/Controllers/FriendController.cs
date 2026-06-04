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
            var response = await _friendService.SendRequestAsync(GetCurrentUserId(), dto);

            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpPost("respond/{requestId}")]
        public async Task<IActionResult> RespondToRequest(Guid requestId, [FromQuery] string action)
        {
            if (action != "accept" && action != "reject")
            {
                return BadRequest(new { message = "Invalid action. Use 'accept' or 'reject'." });
            }

            var response = await _friendService.RespondToRequestAsync(requestId, GetCurrentUserId(), action);

            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingRequests()
        {
            var response = await _friendService.GetPendingRequestsAsync(GetCurrentUserId());
            return response.Success ? Ok(response) : BadRequest(response);
        }

        [HttpGet("list")]
        public async Task<IActionResult> GetFriends()
        {
            var response = await _friendService.GetFriendsAsync(GetCurrentUserId());
            return response.Success ? Ok(response) : BadRequest(response);
        }


        [HttpDelete("unfriend/{targetUserId:guid}")]
        public async Task<IActionResult> Unfriend(Guid targetUserId)
        {
            var response = await _friendService.UnfriendAsync(GetCurrentUserId(), targetUserId);

            return response.Success ? Ok(response) : BadRequest(response);
        }
    }
}

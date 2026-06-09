using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Common;
using Server.Data;
using Server.DTOs.Users;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/user")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IImageService _imageService;

        public UserController(AppDbContext db, IImageService imageService)
        {
            _db = db;
            _imageService = imageService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string q)
        {
            if(string.IsNullOrWhiteSpace(q) || q.Length < 2)
            {
                return BadRequest(new ServiceResult<object> { Success = false, Message = "Need at least three characters" });
            }
                var userId = GetUserId();
                var results = await _db.Users
                                .Where(u => u.Id != userId &&
                                       (u.Name.Contains(q) || u.Email.Contains(q)))
                                .Take(20)
                                .Select(u => new UserProfileDto
                                {
                                    Id = u.Id,
                                    Name = u.Name,
                                    Email = u.Email,
                                    ImageUrl = u.ImageUrl
                                })
                                .ToListAsync();
                return Ok(new ServiceResult<List<UserProfileDto>> { Success = true, Data = results });
        }


        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _db.Users.FindAsync(userId);
            var result = new ServiceResult<UserProfileDto>();
            if (user == null)
            {
                result.Success = false;
                result.Message = "User not found";
                return NotFound(result);
            }
            var data = new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                ImageUrl = user.ImageUrl
            };
            result.Success = true;
            result.Data = data;
            return Ok(result);
        }

        [HttpGet("profile/detail/{targetUserId?}")]
        public async Task<IActionResult> GetProfileDetail(Guid? targetUserId)
        {
            var currentUserId = GetUserId();
            var profileUserId = targetUserId ?? currentUserId;

            var user = await _db.Users
                .Include(u => u.CreatedTrips)
                .Include(u => u.CreatedGroups)
                    .ThenInclude(g => g.Members)
                .FirstOrDefaultAsync(u => u.Id == profileUserId);

            if (user == null)
            {
                return NotFound(new ServiceResult<UserProfileDetailDto> { Success = false, Message = "User not found" });
            }

            var targetUserFriends = await _db.FriendRequests
                .Where(fr => fr.Status == "Accepted" && (fr.SenderId == profileUserId || fr.ReceiverId == profileUserId))
                .Select(fr => fr.SenderId == profileUserId ? fr.ReceiverId : fr.SenderId)
                .ToListAsync();

            int mutualFriendsCount = 0;
            var mutualFriendsList = new List<UserMutualFriendDto>();
            bool isFriend = false;

            if (profileUserId != currentUserId)
            {
                var currentUserFriends = await _db.FriendRequests
                    .Where(fr => fr.Status == "Accepted" && (fr.SenderId == currentUserId || fr.ReceiverId == currentUserId))
                    .Select(fr => fr.SenderId == currentUserId ? fr.ReceiverId : fr.SenderId)
                    .ToListAsync();
                
                isFriend = currentUserFriends.Contains(profileUserId);
                
                var mutualFriendIds = currentUserFriends.Intersect(targetUserFriends).ToList();
                mutualFriendsCount = mutualFriendIds.Count;

                if (mutualFriendsCount > 0)
                {
                    mutualFriendsList = await _db.Users
                        .Where(u => mutualFriendIds.Contains(u.Id))
                        .Take(5) // Just showing up to 5 mutual friends for the UI
                        .Select(u => new UserMutualFriendDto
                        {
                            Id = u.Id,
                            Name = u.Name,
                            ImageUrl = u.ImageUrl
                        }).ToListAsync();
                }
            }

            var detail = new UserProfileDetailDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                ImageUrl = user.ImageUrl,
                CreatedAt = user.CreatedAt,
                TotalFriends = targetUserFriends.Count,
                MutualFriends = mutualFriendsCount,
                MutualFriendsList = mutualFriendsList,
                IsFriend = isFriend,
                CreatedTrips = user.CreatedTrips.OrderByDescending(t => t.CreatedAt).Select(t => new UserTripSummaryDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    Destination = t.Destination,
                    StartDate = t.StartDate,
                    EndDate = t.EndDate,
                    CoverImageUrl = t.CoverImageUrl
                }).ToList(),
                CreatedGroups = user.CreatedGroups.OrderByDescending(g => g.CreatedAt).Select(g => new UserGroupSummaryDto
                {
                    Id = g.Id,
                    Name = g.Name,
                    CoverImageUrl = g.CoverImageUrl,
                    MemberCount = g.Members.Count
                }).ToList()
            };

            return Ok(new ServiceResult<UserProfileDetailDto> { Success = true, Data = detail });
        }


        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("No file provided");

            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var user = await _db.Users.FindAsync(userId);

            if (user == null) return NotFound();

            if (!string.IsNullOrEmpty(user.ImageUrl)) await _imageService.DeleteImageAsync(user.ImageUrl);

            var response = await _imageService.UploadImageAsync(file, "users");
            user.ImageUrl = response.Data;
            await _db.SaveChangesAsync();
            var result = new ServiceResult<object> { Data = new { imageUrl = user.ImageUrl } };
            return Ok(result);
        }

        
    }
}
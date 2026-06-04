using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
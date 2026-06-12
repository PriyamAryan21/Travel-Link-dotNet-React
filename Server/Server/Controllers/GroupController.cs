using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs.Groups;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers
{
        [ApiController]
        [Route("api/group")]
        [Authorize]
    public class GroupController : ControllerBase
    {
        private readonly IGroupService _groupService;
        private readonly AppDbContext _db;
        private readonly IImageService _imageService;
        public GroupController(IGroupService groupService, AppDbContext db, IImageService imageService)
        {
            _groupService = groupService;
            _db = db;
            _imageService = imageService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);


        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateGroupDto dto)
        {
            var response = await _groupService.CreateGroupAsync(GetUserId(), dto);
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyGroups()
        {
            var response = await _groupService.GetMyGroupAsync(GetUserId());
            if(!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult> GetById(Guid id)
        {
            var response = await _groupService.GetGroupByIdAsync(id, GetUserId());
            if (!response.Success) return NotFound(response);

            return Ok(response);
        }

        [HttpPost("{id:guid}/add-member")]
        public async Task<ActionResult> AddMember(Guid id, [FromBody] Guid memberId)
        {
            var response = await _groupService.AddMemberAsync(id, GetUserId(), memberId);

            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("{id:guid}/leave")]
        public async Task<IActionResult> Leave(Guid id)
        {
            var response = await _groupService.LeaveGroupAsync(id, GetUserId());
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpDelete("{id:guid}/remove-member")]
        public async Task<IActionResult> RemoveMember(Guid id, [FromBody] Guid targetUserId)
        {
            var response = await _groupService.RemoveMemberAsync(id, GetUserId(), targetUserId);
            if (!response.Success) return BadRequest(response);
            return Ok(response);
        }

        [HttpPost("{id:guid}/cover")]
        public async Task<IActionResult> UploadCover(Guid id, IFormFile file)
        {
            if(file == null || file.Length == 0) return BadRequest("No file uploaded.");
            var userId = GetUserId();
            var group = await _db.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (group == null) return NotFound("Group not found");

            var isAdmin = group.Members.Any(m => m.UserId == userId && m.Role == "Admin");
            if (!isAdmin) return Forbid("You are not an admin of this group.");

            if (!string.IsNullOrEmpty(group.CoverImageUrl)) await _imageService.DeleteImageAsync(group.CoverImageUrl);

            var response = await _imageService.UploadImageAsync(file, "groups");
            
            if (!response.Success)
            {
                return BadRequest(response);
            }

            group.CoverImageUrl = response.Data;
            await _db.SaveChangesAsync();
            return Ok(new {coverImageUrl = group.CoverImageUrl });    
        }
    }
}

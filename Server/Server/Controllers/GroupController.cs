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
            var group = await _groupService.CreateGroupAsync(GetUserId(), dto);
            return Ok(group);
        }

        [HttpGet("my")]
        public async Task<IActionResult> GetMyGroups()
        {
            var groups = await _groupService.GetMyGroupAsync(GetUserId());
            return Ok(groups);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult> GetById(Guid id)
        {
            var group = await _groupService.GetGroupByIdAsync(id, GetUserId());
            if (group == null) return NotFound("Group not found or access denied");

            return Ok(group);
        }

        [HttpPost("{id:guid}/add-member")]
        public async Task<ActionResult> AddMember(Guid id, [FromBody] Guid memberId)
        {
            var result = await _groupService.AddMemberAsync(id, GetUserId(), memberId);

            if (!result) return BadRequest("Could not add member. You may not be admin, or user is already a member");
            return Ok("Member added");
        }

        [HttpDelete("{id:guid}/leave")]
        public async Task<IActionResult> Leave(Guid id)
        {
            var result = await _groupService.LeaveGroupAsync(id, GetUserId());
            if (!result) return BadRequest("Could not leave group.");
            return Ok("Left the group.");
        }

        [HttpDelete("{id:guid}/remove-member")]
        public async Task<IActionResult> RemoveMember(Guid id, [FromBody] Guid targetUserId)
        {
            var result = await _groupService.RemoveMemberAsync(id, GetUserId(), targetUserId);
            if (!result) return BadRequest("Could not remove member. Admins only.");
            return Ok("Member Removed");
        }

        [HttpPost("{id:guid}/cover")]
        public async Task<IActionResult> UploadCover(Guid id, IFormFile file)
        {
            if(file == null || file.Length == 0) return BadRequest("No file uploaded.");
            var userId = GetUserId();
            var group = await _db.Groups
                .Include(g => g.Members)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (group == null) return NotFound();

            var isAdmin = group.Members.Any(m => m.UserId == userId && m.Role == "Admin");
            if (!isAdmin) return Forbid();

            if (!string.IsNullOrEmpty(group.CoverImageUrl)) await _imageService.DeleteImageAsync(group.CoverImageUrl);

            var imageUrl = await _imageService.UploadImageAsync(file, "groups");
            group.CoverImageUrl = imageUrl;
            await _db.SaveChangesAsync();
            return Ok(new {coverImageUrl = imageUrl });    
        }
    }
}

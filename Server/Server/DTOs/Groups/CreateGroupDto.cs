namespace Server.DTOs.Groups
{
    public class CreateGroupDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? CoverImageUrl { get; set; }
        public List<Guid> MemberIds { get; set; } = new();
    }
}

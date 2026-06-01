namespace Server.Models.Entities
{
    public class GroupMember
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid UserId { get; set; }
        public Guid GroupId { get; set; }
        public User User { get; set; } = null!;
        public Group Group { get; set; } = null!;
        public string Role { get; set; } = "Member"; 
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}

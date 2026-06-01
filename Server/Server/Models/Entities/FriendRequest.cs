namespace Server.Models.Entities
{
    public class FriendRequest
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SenderId { get; set; }
        public Guid ReceiverId { get; set; }
        public User Sender { get; set; } = null!;
        public User Receiver { get; set; } = null!;
        public string Status { get; set; } = "Pending";
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }
}

namespace Server.Models.Entities
{
    public class SuggestionVote
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid SuggestionId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public PlaceSuggestion Suggestion { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}

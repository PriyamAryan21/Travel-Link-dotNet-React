namespace Server.DTOs.Itinerary
{
    public class SuggestionDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type {  get; set; } = string.Empty;
        public string? Notes { get; set; }
        public bool? AdminApproved { get; set; }
        public int VoteCount { get; set; }
        public bool HasCurrentUserVoted { get; set; }
        public string SuggestedByName { get; set; } = string.Empty;
        public string? SuggestedByImageUrl { get; set; }
        public Guid SuggestedByUserId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

namespace Server.Models.Entities
{
    public class PlaceSuggestion
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ItineraryRequestId { get; set; }
        public Guid SuggestedByUserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Type { get; set; } = "place";
        public string? Notes { get; set; }
        public bool? AdminApproved { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public ItineraryRequest ItineraryRequest { get; set; } = null!;
        public User SuggestedBy { get; set; } = null!;
        public ICollection<SuggestionVote> Votes { get; set; } = new List<SuggestionVote>();

    }
}

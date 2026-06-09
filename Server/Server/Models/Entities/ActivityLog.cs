namespace Server.Models.Entities
{
    public class ActivityLog
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid GroupId { get; set; }
        public Guid UserId { get; set; }

        // "TRIP_CREATED", "EXPENSE_ADDED", "ITINERARY_GENERATED"
        public string ActionType { get; set; } = string.Empty;

        // "Priyam added a new expense for Dinner"
        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Group Group { get; set; } = null!;
        public User User { get; set; } = null!;
    }
}

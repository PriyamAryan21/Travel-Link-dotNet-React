namespace Server.Models.Entities
{
    public class Expense
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Amount { get; set; }
        public string Category { get; set; } = "General";
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid PaidByUserId { get; set; }
        public User PaidBy { get; set; } = null!;
        public Guid? GroupId { get; set; }
        public Group? Group { get; set; } = null!;
        public ICollection<ExpenseSplit> Splits { get; set; } = new List<ExpenseSplit>();

    }
}

namespace Server.DTOs.Expenses
{
    public class CreateExpenseDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Amount { get; set; }
        public string Category { get; set; } = "General";
        public DateTime Date { get; set; } = DateTime.UtcNow;
        public Guid? GroupId { get; set; }
        public string SplitType { get; set; } = "Equal";
        public List<Guid> ParticipantIds { get; set; } = new();
        public List<ExpenseSplitInputDto> Splits { get; set; } = new();
    }
}

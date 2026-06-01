namespace Server.DTOs.Expenses
{
    public class ExpenseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? Category { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public DateTime CreatedAt { get; set; }
        public Guid PaidByUserId { get; set; }
        public string PaidByUser { get; set; } = string.Empty;
        public string? PaidByImageUrl { get; set; } = string.Empty;
        public Guid? GroupId { get; set; }
        public List<ExpenseSplitDto> Splits { get; set; } = new();
        public string? Warning { get; set; }
    }
}

namespace Server.DTOs.Expenses
{
    public class ExpenseSplitDto
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? UserImageUrl { get; set; }
        public decimal AmountOwed { get; set; }
        public bool isPaid { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}

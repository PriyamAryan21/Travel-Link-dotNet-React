namespace Server.Models.Entities
{
    public class ExpenseSplit
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid ExpenseId { get; set; }
        public Expense Expense { get; set; } = null!;
        public Guid UserId { get; set; }
        public User User { get; set; } = null!;
        public decimal AmountOwed { get; set; }
        public bool IsPaid { get; set; } = false;
        public DateTime? PaidAt { get; set; }

    }
}

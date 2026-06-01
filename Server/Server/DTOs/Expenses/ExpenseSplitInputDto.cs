namespace Server.DTOs.Expenses
{
    public class ExpenseSplitInputDto
    {
        public Guid UserId { get; set; }
        public decimal AmountOwed { get; set; }
    }
}

namespace Server.DTOs.Expenses
{
    public class UserToUserDto
    {
        public Guid UserId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public decimal NetBalance { get; set; }
        public decimal TotalYouOwe { get; set; }
        public List<string> commonGroups { get; set; } = new();
        public List<UserTransactionDto> Transactions { get; set; } = new();

        public class UserTransactionDto
        {
            public Guid ExpenseId { get; set; }
            public string Title { get; set; } = string.Empty;
            public decimal Amount { get; set; }
            public string Category { get; set; } = string.Empty;
            public DateTime Date { get; set; }
            public bool YouPaid { get; set; }
            public decimal YourShare { get; set; }
            public bool IsSettled { get; set; }
            public string? GroupName { get; set; }
        }
    }
}

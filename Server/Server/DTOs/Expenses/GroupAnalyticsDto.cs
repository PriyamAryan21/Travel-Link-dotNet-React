namespace Server.DTOs.Expenses
{
    public class GroupAnalyticsDto
    {
        public decimal TotalGroupSpend { get; set; }
        public decimal TotalSettled { get; set; }
        public decimal TotalUnsettled { get; set; }
        public int TotalExpenses { get; set; }
        public List<CategoryBreakdownDto> CategoryBreakdown { get; set; } = new();
        public List<MemberContributionDto> MemberContributions { get; set; } = new();
        public List<BalanceDto> Balances { get; set; } = new();
        public class CategoryBreakdownDto
        {
            public string Category { get; set; } = string.Empty;
            public decimal TotalAmount { get; set; }
            public int ExpenseCount { get; set; }
            public decimal Percentage { get; set; }
        }

        public class MemberContributionDto
        {
            public Guid UserId { get; set; }
            public string UserName { get; set; } = string.Empty;
            public string? ImageUrl { get; set; }
            public decimal TotalPaid { get; set; }
            public decimal TotalOwed { get; set; }
            public decimal NetBalance { get; set; }
        }
    }
}

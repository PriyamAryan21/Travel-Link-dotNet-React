namespace Server.DTOs.Expenses
{
    public class BalanceDto
    {
        public Guid FromUserId { get; set; }
        public string FromUserName { get; set; } = string.Empty;
        public string? FromUserImageUrl { get; set; }
        public Guid ToUserId { get; set; }
        public string ToUserName { get; set; } = string.Empty;
        public string? ToUserImageUrl { get; set; }
        public decimal Amount { get; set; }
    }
}

using Server.Common;
using Server.DTOs.Expenses;

namespace Server.Services
{
    public interface IExpenseService
    {
        Task<ServiceResult<ExpenseDto?>> AddExpenseAsync(Guid userId, CreateExpenseDto dto);
        Task<ServiceResult<ExpenseDto?>> GetExpenseByIdAsync(Guid expenseId, Guid userId);
        Task<ServiceResult<List<ExpenseDto>>> GetGroupExpenseAsync(Guid groupId, Guid userId);
        Task<ServiceResult<bool>> DeleteExpenseAsync(Guid expenseId, Guid userId);
        Task<ServiceResult<bool>> MarkSplitAsPaidAsync(Guid splitId, Guid userId);
        Task<ServiceResult<List<BalanceDto>>> GetGroupBalanceAsync(Guid groupId, Guid userId);
        Task<ServiceResult<GroupAnalyticsDto?>> GetGroupAnalyticAsync(Guid groupId, Guid userId);
        Task<ServiceResult<UserToUserDto?>> GetUserToUserSummaryAsync(Guid targetUserId, Guid currentUserId);
    }
}

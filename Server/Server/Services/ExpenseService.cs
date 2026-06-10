using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs.Expenses;
using Server.Models.Entities;
using Server.Common;
namespace Server.Services
{
    public class ExpenseService : IExpenseService
    {
        private readonly AppDbContext _db;
        private readonly ILoggingService _loggingService;
        public ExpenseService(AppDbContext db, ILoggingService loggingService)
        {
            _db = db;
            _loggingService = loggingService;
        }
        public async Task<ServiceResult<ExpenseDto?>> AddExpenseAsync(Guid userId, CreateExpenseDto dto)
        {
            if (dto.Amount <= 0) return ServiceResult<ExpenseDto?>.Fail("Amount must be greater than zero");

            if (dto.GroupId.HasValue)
            {
                var isMember = await _db.GroupMembers
                    .AnyAsync(m => m.GroupId == dto.GroupId && m.UserId == userId);
                if (!isMember) return ServiceResult<ExpenseDto?>.Fail("You are not a member of the group");
            }
            else
            {
                var peopleToCheck = dto.SplitType.Equals("Custom", StringComparison.OrdinalIgnoreCase)
                    ? dto.Splits.Select(s => s.UserId).Where(id => id != userId).ToList()
                    :
                    dto.ParticipantIds.Where(id => id != userId).ToList();

                foreach(var participantId in peopleToCheck)
                {
                    bool areFriends = await AreFriendsAsync(userId, participantId);
                    if (!areFriends) return ServiceResult<ExpenseDto?>.Fail("You can only split expenses with friends");
                }
            }

                var expense = new Expense
                {
                    Title = dto.Title.Trim(),
                    Description = dto.Description?.Trim(),
                    Amount = dto.Amount,
                    Category = string.IsNullOrWhiteSpace(dto.Category) ? "General" : dto.Category.Trim(),
                    Date = dto.Date.ToUniversalTime(),
                    PaidByUserId = userId,
                    GroupId = dto.GroupId,
                };

            _db.Expenses.Add(expense);
            List<ExpenseSplit>? splits;
            if (!dto.SplitType.Equals("Equal", StringComparison.OrdinalIgnoreCase) &&
                !dto.SplitType.Equals("Custom", StringComparison.OrdinalIgnoreCase))
                return ServiceResult<ExpenseDto?>.Fail("SplitType must be 'Equal' or 'Custom'");
            if (dto.SplitType.Equals("Equal", StringComparison.OrdinalIgnoreCase))
            {
                splits = await BuildEqualSplitsAsync(expense, userId, dto.ParticipantIds);
            }
            else
            {
                splits = await BuildCustomSplitsAsync(expense, dto.Splits, userId);
            }
            if (splits == null) return ServiceResult<ExpenseDto?>.Fail("Invalid split configuration");
            _db.ExpenseSplits.AddRange(splits);
            await _db.SaveChangesAsync();


            //LOGGING & NOTIFICATIONS
            if (dto.GroupId.HasValue)
            {
                await _loggingService.LogGroupActivityAsync(dto.GroupId.Value, userId, "EXPENSE_ADDED", $"added a new expense: {expense.Title} (₹{expense.Amount})");
            }

            var payer = await _db.Users.FindAsync(userId);
            var payerName = payer?.Name ?? "Someone";

            foreach (var split in splits.Where(s => s.UserId != userId))
            {
                await _loggingService.SendNotificationAsync(
                    split.UserId,
                    "New Expense Split",
                    $"{payerName} added a new expense '{expense.Title}'. You owe ₹{split.AmountOwed}.",
                    dto.GroupId.HasValue ? $"/expenses/group/{dto.GroupId}" : "/expenses"
                );
            }

            var result = await GetExpenseByIdAsync(expense.Id, userId);

            if(result.Success 
                && dto.GroupId==null 
                && dto.ParticipantIds.Count > 0 
                && !dto.ParticipantIds.Contains(userId))
            {
                result.Data!.Warning = "You are not included in this expense split. You paid on behalf of others and will be reimbursed.";
            }
            return ServiceResult<ExpenseDto?>.Ok(result.Data);
        }


        public async Task<ServiceResult<bool>> DeleteExpenseAsync(Guid expenseId, Guid userId)
        {
            var expense = await _db.Expenses
                .Include(e => e.Splits)
                .FirstOrDefaultAsync(e => e.Id == expenseId);

            if (expense == null) return ServiceResult<bool>.Fail("Expense not found");

            if(expense.PaidByUserId != userId) return ServiceResult<bool>.Fail("Only the person who paid can delete this expense.");

            bool othersSettled = expense.Splits.Any(s => s.UserId != userId && s.IsPaid);

            if(othersSettled) return ServiceResult<bool>.Fail("Cannot delete — one or more participants have already settled their share");

            _db.Expenses.Remove(expense);
            await _db.SaveChangesAsync();

            // LOGGING

            _db.Expenses.Remove(expense);
            if (expense.GroupId.HasValue)
            {
                await _loggingService.LogGroupActivityAsync(expense.GroupId.Value, userId, "EXPENSE_DELETED", $"deleted the expense: {expense.Title}");
            }


            return ServiceResult<bool>.Ok(true);
        }

        public async Task<ServiceResult<ExpenseDto?>> GetExpenseByIdAsync(Guid expenseId, Guid userId)
        {
            var expense = await _db.Expenses
                .Include(e => e.PaidBy)
                .Include(e => e.Splits)
                .ThenInclude(s => s.User)
                .FirstOrDefaultAsync(e => e.Id == expenseId);

            if (expense == null) return ServiceResult<ExpenseDto?>.Fail("Expense not found"); 

            bool authorized = expense.PaidByUserId == userId
                || expense.Splits.Any(s => s.UserId == userId) 
                || (expense.GroupId.HasValue 
                    && await _db.GroupMembers
                    .AnyAsync(m => m.GroupId == expense.GroupId 
                    && m.UserId == userId));

            if (!authorized) return ServiceResult<ExpenseDto?>.Fail("You are not authorized to view this expense"); 

            return ServiceResult<ExpenseDto?>.Ok(MapToExpenseDto(expense)); ;
        }

        public async Task<ServiceResult<GroupAnalyticsDto?>> GetGroupAnalyticAsync(Guid groupId, Guid userId)
        {
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId);

            if (!isMember) return ServiceResult<GroupAnalyticsDto?>.Fail("You are not a member of this group");

            var expenses = await _db.Expenses
                .Where(e => e.GroupId == groupId)
                .Include(e => e.Splits)
                .ThenInclude(s => s.User)
                .Include(e => e.PaidBy)
                .ToListAsync();

            var allSplits = expenses.SelectMany(e => e.Splits).ToList();

            decimal totalSpend = expenses.Sum(e => e.Amount);
            decimal totalSettled = allSplits.Where(s => s.IsPaid).Sum(s => s.AmountOwed);
            decimal totalUnsettled = allSplits.Where(s => !s.IsPaid).Sum(s => s.AmountOwed);

            var categoryBreakdown = expenses
                .GroupBy(e => e.Category)
                .Select(g => new GroupAnalyticsDto.CategoryBreakdownDto
                {
                    Category = g.Key,
                    TotalAmount = g.Sum(e => e.Amount),
                    ExpenseCount = g.Count(),
                    Percentage = totalSpend > 0 ? Math.Round(g.Sum(e => e.Amount) / totalSpend * 100, 1) : 0
                })
                .OrderByDescending(c => c.TotalAmount)
                .ToList();

            var members = await _db.GroupMembers
                .Where(m => m.GroupId == groupId)
                .Include(m => m.User)
                .ToListAsync();

            var unPaidSplits = allSplits.Where(s => !s.IsPaid && s.UserId != s.Expense?.PaidByUserId).ToList();

            var memberContributions = members.Select(m =>
            {
                decimal totalPaid = expenses
                    .Where(e => e.PaidByUserId == m.UserId)
                    .Sum(e => e.Amount);
                decimal totalOwed = allSplits
                    .Where(s => s.UserId == m.UserId)
                    .Sum(s => s.AmountOwed);
                
                decimal currentOwedToMe = unPaidSplits.Where(s => s.Expense?.PaidByUserId == m.UserId).Sum(s => s.AmountOwed);
                decimal currentIOwe = unPaidSplits.Where(s => s.UserId == m.UserId).Sum(s => s.AmountOwed);
                return new GroupAnalyticsDto.MemberContributionDto
                {
                    UserId = m.UserId,
                    UserName = m.User?.Name ?? string.Empty,
                    ImageUrl = m.User?.ImageUrl,
                    TotalPaid = totalPaid,
                    TotalOwed = totalOwed,
                    NetBalance = Math.Round(currentOwedToMe - currentIOwe, 2)
                };
            }).ToList();

            var balances = CalculateBalances(allSplits.Where(s => !s.IsPaid).ToList());

            var result = new GroupAnalyticsDto
            {
                TotalGroupSpend = totalSpend,
                TotalSettled = totalSettled,
                TotalUnsettled = totalUnsettled,
                TotalExpenses = expenses.Count,
                CategoryBreakdown = categoryBreakdown,
                MemberContributions = memberContributions,
                Balances = balances
            };

            return ServiceResult<GroupAnalyticsDto?>.Ok(result);
        }

        public async Task<ServiceResult<List<BalanceDto>>> GetGroupBalanceAsync(Guid groupId, Guid userId)
        {
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId
                && m.UserId == userId);

            if(!isMember) return ServiceResult<List<BalanceDto>>.Fail("You are not a member of this group");

            var unPaidSplits = await _db.ExpenseSplits
                .Where(s => s.Expense.GroupId == groupId && !s.IsPaid)
                .Include(s=> s.Expense)
                .Include(s => s.User)
                .Include(s => s.Expense.PaidBy)
                .ToListAsync();

            return ServiceResult<List<BalanceDto>>.Ok(CalculateBalances(unPaidSplits));
        }

        public async Task<ServiceResult<List<ExpenseDto>>> GetGroupExpenseAsync(Guid groupId, Guid userId)
        {
            var isMember = await _db.GroupMembers
                .AnyAsync(m => m.GroupId == groupId && m.UserId == userId);
            if (!isMember) return ServiceResult<List<ExpenseDto>>.Fail("You are not a member of this group");

            var result = await _db.Expenses
                .Where(e => e.GroupId == groupId)
                .OrderByDescending(e => e.Date)
                .Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    Amount = e.Amount,
                    Category = e.Category,
                    Date = e.Date,
                    CreatedAt = e.CreatedAt,
                    PaidByUserId = e.PaidByUserId,
                    PaidByUser = e.PaidBy != null ? e.PaidBy.Name : string.Empty,
                    PaidByImageUrl = e.PaidBy != null ? e.PaidBy.ImageUrl : null,
                    GroupId = e.GroupId,
                    Splits = e.Splits.Select(s => new ExpenseSplitDto
                    {
                        Id = s.Id,
                        UserId = s.UserId,
                        Name = s.User != null ? s.User.Name : string.Empty,
                        UserImageUrl = s.User != null ? s.User.ImageUrl : null,
                        AmountOwed = s.AmountOwed,
                        isPaid = s.IsPaid,
                        PaidAt = s.PaidAt
                    }).ToList()
                })
                .ToListAsync();

            return ServiceResult<List<ExpenseDto>>.Ok(result);
        }

        public async Task<ServiceResult<UserToUserDto?>> GetUserToUserSummaryAsync(Guid targetUserId, Guid currentUserId)
        {
            var targetUser = await _db.Users.FindAsync(targetUserId);
            if (targetUser == null) return ServiceResult<UserToUserDto?>.Fail("User not found");

            var sharedExpenses = await _db.Expenses
                .Where(e =>
                    (e.PaidByUserId == currentUserId && e.Splits.Any(s => s.UserId == targetUserId)) ||
                    (e.PaidByUserId == targetUserId && e.Splits.Any(s => s.UserId == currentUserId)))
                .Include(e => e.PaidBy)
                .Include(e => e.Group)
                .Include(e => e.Splits).ThenInclude(s => s.User)
                .OrderByDescending(e => e.Date)
                .ToListAsync();

            decimal totalYouOwe = 0;
            decimal totalTheyOwe = 0;

            var transactions = new List<UserToUserDto.UserTransactionDto>();

            foreach(var expense in sharedExpenses)
            {
                bool youPaid = expense.PaidByUserId == currentUserId;
                if (youPaid)
                {
                    var theirSplit = expense.Splits.FirstOrDefault(s => s.UserId == targetUserId);

                    var yourSplit = expense.Splits.FirstOrDefault(s => s.UserId == currentUserId);

                    if(theirSplit != null && !theirSplit.IsPaid)
                    {
                        totalTheyOwe += theirSplit.AmountOwed;
                    }

                    transactions.Add(new UserToUserDto.UserTransactionDto
                    {
                        ExpenseId = expense.Id,
                        Title = expense.Title,
                        Amount = expense.Amount,
                        Category = expense.Category,
                        Date = expense.Date,
                        YouPaid = true,
                        YourShare = yourSplit?.AmountOwed ?? 0,
                        IsSettled = theirSplit?.IsPaid ?? true,
                        GroupName = expense.Group?.Name
                    });
                }
                else
                {
                    var yourSplit = expense.Splits.FirstOrDefault(s => s.UserId == currentUserId);

                    if(yourSplit != null && !yourSplit.IsPaid)
                    {
                        totalYouOwe += yourSplit.AmountOwed;
                    }
                    transactions.Add(new UserToUserDto.UserTransactionDto
                    {
                        ExpenseId = expense.Id,
                        Title = expense.Title,
                        Amount = expense.Amount,
                        Category = expense.Category,
                        Date = expense.Date,
                        YouPaid = false,
                        YourShare = yourSplit?.AmountOwed ?? 0,
                        IsSettled = yourSplit?.IsPaid ?? true,
                        GroupName = expense.Group?.Name
                    });
                }
            }

            var commmonGroups = await _db.GroupMembers
                .Where(m => m.UserId == currentUserId)
                .Select(m => m.GroupId)
                .Intersect(
                    _db.GroupMembers
                    .Where(m => m.UserId == targetUserId)
                    .Select(m => m.GroupId))
                .Join(_db.Groups, id => id, g => g.Id, (id, g) => g.Name)
                .ToListAsync();

            var result = new UserToUserDto
            {
                UserId = targetUserId,
                Name = targetUser.Name,
                ImageUrl = targetUser.ImageUrl,
                NetBalance = Math.Round(totalTheyOwe - totalYouOwe, 2),
                TotalYouOwe = Math.Round(totalYouOwe, 2),
                Transactions = transactions,
                commonGroups = commmonGroups
            };

            return ServiceResult<UserToUserDto?>.Ok(result);
        }

        public async Task<ServiceResult<bool>> MarkSplitAsPaidAsync(Guid splitId, Guid userId)
        {
            var split = await _db.ExpenseSplits
                .FirstOrDefaultAsync(s => s.Id == splitId);

            if (split == null) return ServiceResult<bool>.Fail("Split not found");
            if (split.UserId != userId) return ServiceResult<bool>.Fail("You can only settle your own split");
            if(split.IsPaid) return ServiceResult<bool>.Ok(true);

            split.IsPaid = true;
            split.PaidAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();

            //LOGGING & NOTIFICATIONS
            var expenseRecord = await _db.Expenses.FirstOrDefaultAsync(e => e.Id == split.ExpenseId);
            var settler = await _db.Users.FindAsync(userId);

            if (expenseRecord != null && settler != null)
            {
                
                await _loggingService.SendNotificationAsync(
                    expenseRecord.PaidByUserId,
                    "Expense Settled",
                    $"{settler.Name} has settled their share of ₹{split.AmountOwed} for '{expenseRecord.Title}'.",
                    expenseRecord.GroupId.HasValue ? $"/expenses/group/{expenseRecord.GroupId}" : "/expenses"
                );

                if (expenseRecord.GroupId.HasValue)
                {
                    await _loggingService.LogGroupActivityAsync(
                        expenseRecord.GroupId.Value,
                        userId,
                        "EXPENSE_SETTLED",
                        $"settled their share of ₹{split.AmountOwed} for '{expenseRecord.Title}'"
                    );
                }
            }


            return ServiceResult<bool>.Ok(true);
        }

        private static ExpenseDto MapToExpenseDto(Expense e) => new ExpenseDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            Amount = e.Amount,
            Category = e.Category,
            Date = e.Date,
            CreatedAt = e.CreatedAt,
            PaidByUserId = e.PaidByUserId,
            PaidByUser = e.PaidBy?.Name?? string.Empty,
            PaidByImageUrl = e.PaidBy?.ImageUrl,
            GroupId = e.GroupId,
            Splits = e.Splits.Select(s => new ExpenseSplitDto
            {
                Id = s.Id,
                UserId = s.UserId,
                Name = s.User?.Name ?? String.Empty,
                UserImageUrl = s.User?.ImageUrl,
                AmountOwed = s.AmountOwed,
                isPaid = s.IsPaid,
                PaidAt = s.PaidAt
            }).ToList()
        };

        private async Task<bool> AreFriendsAsync(Guid userA, Guid userB)
        {
            return await _db.FriendRequests
                .AnyAsync(f => f.Status == "Accepted" && ((f.SenderId == userA && f.ReceiverId == userB) || (f.SenderId == userB && f.ReceiverId == userA)));
        }
        private async Task<List<ExpenseSplit>> BuildEqualSplitsAsync(Expense expense, Guid payerId, List<Guid> participantIds)
        {
            if (expense.GroupId.HasValue && (participantIds == null || participantIds.Count == 0))
            {
                participantIds = await _db.GroupMembers
                    .Where(m => m.GroupId == expense.GroupId)
                    .Select(m => m.UserId)
                    .ToListAsync();
            }
            else
            {
                if(participantIds == null || participantIds.Count == 0)
                {
                    participantIds = new List<Guid> { payerId };
                }
            }

            //if(!participantIds.Contains(payerId))
            //{
            //    participantIds.Add(payerId);
            //}

            participantIds = participantIds.Distinct().ToList();

            int count = participantIds.Count;
            decimal perPerson = Math.Round(expense.Amount / count, 2);
            decimal remainder = expense.Amount - (perPerson * count);

            var splits = new List<ExpenseSplit>();
            for(int i = 0; i < participantIds.Count; i++)
            {
                var uId = participantIds[i];
                decimal amount = (i == participantIds.Count - 1) ? perPerson + remainder : perPerson;
                splits.Add(new ExpenseSplit
                {
                    ExpenseId = expense.Id,
                    UserId = uId,
                    AmountOwed = amount,
                    IsPaid = uId == payerId,
                    PaidAt = uId == payerId ? DateTime.UtcNow : null
                });
            }
            return splits;
        }

        private Task<List<ExpenseSplit>?> BuildCustomSplitsAsync(Expense expense, List<ExpenseSplitInputDto> inputSplits, Guid payerId)
        {
            if (inputSplits == null || inputSplits.Count == 0) return Task.FromResult<List<ExpenseSplit>?>(null);
            if (inputSplits.Any(s => s.AmountOwed <= 0)) return Task.FromResult<List<ExpenseSplit>?>(null);

            if (inputSplits.Select(s => s.UserId).Distinct().Count() != inputSplits.Count)
                return Task.FromResult<List<ExpenseSplit>?>(null);

            decimal splitSum = inputSplits.Sum(s => s.AmountOwed);
            if (Math.Abs(splitSum - expense.Amount) > 0.01m)
                return Task.FromResult<List<ExpenseSplit>?>(null);

            var splits = inputSplits.Select(s => new ExpenseSplit
            {
                ExpenseId = expense.Id,
                UserId = s.UserId,
                AmountOwed = Math.Round(s.AmountOwed, 2),
                IsPaid = s.UserId == payerId,
                PaidAt = s.UserId == payerId ? DateTime.UtcNow : null
            }).ToList();

            return Task.FromResult<List<ExpenseSplit>?>(splits);
        }

        public async Task<ServiceResult<List<ExpenseDto>>> GetUserExpenseAsync(Guid userId)
        {
            var expenses = await _db.Expenses
                .Where(e => e.PaidByUserId == userId || e.Splits.Any(s => s.UserId == userId))
                .OrderByDescending(e => e.Date)
                .Select(e => new ExpenseDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    Description = e.Description,
                    Amount = e.Amount,
                    Category = e.Category,
                    Date = e.Date,
                    CreatedAt = e.CreatedAt,
                    PaidByUserId = e.PaidByUserId,
                    PaidByUser = e.PaidBy != null ? e.PaidBy.Name : string.Empty,
                    PaidByImageUrl = e.PaidBy != null ? e.PaidBy.ImageUrl : null,
                    GroupId = e.GroupId,
                    Splits = e.Splits.Select(s => new ExpenseSplitDto
                    {
                        Id = s.Id,
                        UserId = s.UserId,
                        Name = s.User != null ? s.User.Name : string.Empty,
                        UserImageUrl = s.User != null ? s.User.ImageUrl : null,
                        AmountOwed = s.AmountOwed,
                        isPaid = s.IsPaid,
                        PaidAt = s.PaidAt
                    }).ToList()
                })
                .ToListAsync();

            return ServiceResult<List<ExpenseDto>>.Ok(expenses);
        }

        private List<BalanceDto> CalculateBalances(IEnumerable<ExpenseSplit> unPaidSplits)
        {
            var netDebts = new Dictionary<(Guid debtor, Guid creditor), decimal>();

            foreach(var split in unPaidSplits)
            {
                var debtor = split.UserId;
                var creditor = split.Expense?.PaidByUserId ?? Guid.Empty;

                if (creditor == Guid.Empty || debtor == creditor) continue;
                var key = (debtor, creditor);
                var reverseKey = (creditor, debtor);

                if (netDebts.ContainsKey(reverseKey))
                {
                    netDebts[reverseKey] -= split.AmountOwed;
                    if (netDebts[reverseKey] < 0)
                    {
                        netDebts[key] = -netDebts[reverseKey];
                        netDebts.Remove(reverseKey);
                    }
                    else if (netDebts[reverseKey] == 0)
                    {
                        netDebts.Remove(reverseKey);
                    }
                }
                else
                {
                    netDebts.TryGetValue(key, out decimal existing);
                    netDebts[key] = existing + split.AmountOwed;
                }
            }

            var users = unPaidSplits
                .SelectMany(s => new[] 
                { 
                    new { Id = s.UserId, Name = s.User?.Name, ImageUrl = s.User?.ImageUrl },
                    new { Id = s.Expense?.PaidByUserId ?? Guid.Empty, Name = s.Expense?.PaidBy?.Name, ImageUrl = s.Expense?.PaidBy?.ImageUrl }
                })
                .Where(u => u.Id != Guid.Empty)
                .GroupBy(u => u.Id)
                .ToDictionary(g => g.Key, g => g.First());

            var results = netDebts
                .Where(kvp => kvp.Value > 0)
                .Select(kvp =>
                {
                    users.TryGetValue(kvp.Key.debtor, out var from);
                    users.TryGetValue(kvp.Key.creditor, out var to);
                    return new BalanceDto
                    {
                        FromUserId = kvp.Key.debtor,
                        FromUserName = from?.Name ?? string.Empty,
                        FromUserImageUrl = from?.ImageUrl,
                        ToUserId = kvp.Key.creditor,
                        ToUserName = to?.Name ?? string.Empty,
                        ToUserImageUrl = to?.ImageUrl,
                        Amount = Math.Round(kvp.Value, 2)
                    };
                }).ToList();

            return results;
        }
    }
}

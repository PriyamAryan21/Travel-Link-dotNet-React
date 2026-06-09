export interface BalanceDto {
    fromUserId: string;
    fromUserName: string;
    fromUserImageUrl?: string;
    toUserId: string;
    toUserName: string;
    toUserImageUrl?: string;
    amount: number;
}

export interface CreateExpenseDto {
    title: string;
    description?: string;
    amount: number;
    category: string;
    date: string;
    groupId?: string;
    splitType: string;
    participantIds: string[];
    splits: ExpenseSplitInputDto[];
}

export interface ExpenseDto {
    id: string;
    title: string;
    description?: string;
    amount: number;
    category?: string;
    date: string;
    createdAt: string;
    paidByUserId: string;
    paidByUser: string;
    paidByImageUrl?: string;
    groupId?: string;
    splits: ExpenseSplitDto[];
    warning?: string;
}

export interface ExpenseSplitDto {
    id: string;
    userId: string;
    name: string;
    userImageUrl?: string;
    amountOwed: number;
    isPaid: boolean;
    paidAt?: string;
}

export interface ExpenseSplitInputDto {
    userId: string;
    amountOwed: number;
}

export interface GroupAnalyticsDto {
    totalGroupSpend: number;
    totalSettled: number;
    totalUnsettled: number;
    totalExpenses: number;
    categoryBreakdown: CategoryBreakdownDto[];
    memberContributions: MemberContributionDto[];
    balances: BalanceDto[];
}

export interface CategoryBreakdownDto {
    category: string;
    totalAmount: number;
    expenseCount: number;
    percentage: number;
}

export interface MemberContributionDto {
    userId: string;
    userName: string;
    imageUrl?: string;
    totalPaid: number;
    totalOwed: number;
    netBalance: number;
}

export interface UserToUserDto {
    userId: string;
    name: string;
    imageUrl?: string;
    netBalance: number;
    totalYouOwe: number;
    commonGroups: string[];
    transactions: UserTransactionDto[];
}

export interface UserTransactionDto {
    expenseId: string;
    title: string;
    amount: number;
    category: string;
    date: string;
    youPaid: boolean;
    yourShare: number;
    isSettled: boolean;
    groupName?: string;
}


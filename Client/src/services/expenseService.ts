import type {
    CreateExpenseDto,
    ExpenseDto,
    BalanceDto,
    GroupAnalyticsDto,
    UserToUserDto
} from "../types";
import api, { unwrap } from "./api";

const expenseService = {
    // ── CREATE ──
    CreateExpense: (dto: CreateExpenseDto) =>
        unwrap<ExpenseDto>(api.post("expense/add", dto)),

    // ── READ ──
    GetExpenseById: (expenseId: string) =>
        unwrap<ExpenseDto>(api.get(`expense/${expenseId}`)),

    GetUserExpenses: () =>
        unwrap<ExpenseDto[]>(api.get("expense/user")),

    GetGroupExpenses: (groupId: string) =>
        unwrap<ExpenseDto[]>(api.get(`expense/group/${groupId}`)),

    GetGroupBalances: (groupId: string) =>
        unwrap<BalanceDto[]>(api.get(`expense/group/${groupId}/balances`)),

    GetGroupAnalytics: (groupId: string) =>
        unwrap<GroupAnalyticsDto>(api.get(`expense/group/${groupId}/analytics`)),

    GetUserToUserSummary: (userId: string) =>
        unwrap<UserToUserDto>(api.get(`expense/user/${userId}/summary`)),

    MarkSplitAsPaid: (splitId: string) =>
        unwrap<boolean>(api.put(`expense/split/${splitId}/pay`)),

    DeleteExpenseAsync: (expenseId: string) =>
        unwrap<boolean>(api.delete(`expense/${expenseId}`)),
};

export default expenseService;

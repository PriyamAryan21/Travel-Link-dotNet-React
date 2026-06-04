using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Server.DTOs.Expenses;
using Server.Services;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/expense")]
    [Authorize]
    public class ExpenseController : ControllerBase
    {
        private readonly IExpenseService _expenseService;
        public ExpenseController(IExpenseService expenseService)
        {
            _expenseService = expenseService;
        }
        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);


        [HttpPost("add")]
        public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
        {
            var result = await _expenseService.AddExpenseAsync(GetUserId(), dto);
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }


        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var result = await _expenseService.GetExpenseByIdAsync(id, GetUserId());
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }


        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _expenseService.DeleteExpenseAsync(id, GetUserId());
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }


        [HttpGet("group/{groupId:guid}")]
        public async Task<IActionResult> GetGroupExpenses(Guid groupId)
        {
            var result = await _expenseService.GetGroupExpenseAsync(groupId, GetUserId());
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }


        [HttpGet("group/{groupId:guid}/balances")]
        public async Task<IActionResult> GetGroupBalances(Guid groupId)
        {
            var result = await _expenseService.GetGroupBalanceAsync(groupId, GetUserId());
            if (!result.Success) return NotFound(result);
            return Ok(result);

        }

        [HttpGet("group/{groupId:guid}/analytics")]
        public async Task<IActionResult> GetGroupAnalytics(Guid groupId)
        {
            var result = await _expenseService.GetGroupAnalyticAsync(groupId, GetUserId());
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }

        [HttpPut("split/{splitId:guid}/pay")]
        public async Task<IActionResult> MarkSplitAsPaid(Guid splitId)
        {
            var result = await _expenseService.MarkSplitAsPaidAsync(splitId, GetUserId());
            if (!result.Success) return BadRequest(result);
            return Ok(result);
        }


        [HttpGet("user/{userId:guid}/summary")]
        public async Task<IActionResult> GetUserToUserSummary(Guid userId)
        {
            var result = await _expenseService.GetUserToUserSummaryAsync(userId, GetUserId());
            if (!result.Success) return NotFound(result);
            return Ok(result);
        }
    }
}

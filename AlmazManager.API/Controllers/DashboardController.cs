using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Dashboard.Handlers;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController : ControllerBase
{
    private readonly GetDashboardHandler _handler;

    public DashboardController(GetDashboardHandler handler)
    {
        _handler = handler;
    }

    [HttpGet]
    public async Task<ActionResult<DashboardResponse>> Get()
    {
        var response = await _handler.HandleAsync();

        return Ok(response);
    }

    [HttpGet("consumption")]
    public async Task<ActionResult<ConsumptionStatisticsResponse>> GetConsumption(
        [FromQuery] DateOnly? from,
        [FromQuery] DateOnly? to,
        [FromQuery] Guid? materialId,
        [FromQuery] Guid? categoryId,
        [FromQuery] Guid? userId)
    {
        var end = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var start = from ?? end.AddDays(-6);

        return Ok(await _handler.GetConsumptionAsync(
            start,
            end,
            materialId,
            categoryId,
            userId));
    }
}

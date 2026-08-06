using Microsoft.AspNetCore.Mvc;
using WarehouseManager.Application.Features.Dashboard.Handlers;
using WarehouseManager.Contracts.Responses;

namespace WarehouseManager.API.Controllers;

[ApiController]
[Route("api/dashboard")]
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
}
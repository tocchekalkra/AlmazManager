using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Dashboard.Handlers;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

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

using Microsoft.AspNetCore.Mvc;
using WarehouseManager.Application.Features.Issue.Commands;
using WarehouseManager.Application.Features.Issue.Handlers;
using WarehouseManager.Contracts.Requests.Issue;
using WarehouseManager.Contracts.Responses;

namespace WarehouseManager.API.Controllers;

[ApiController]
[Route("api/issue")]
public sealed class IssueController : ControllerBase
{
    private readonly IssueMaterialHandler _handler;

    public IssueController(IssueMaterialHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    public async Task<ActionResult<IssueMaterialResponse>> Issue(
        IssueMaterialRequest request)
    {
        var command = new IssueMaterialCommand(
            request.MaterialId,
            request.Quantity,
            request.UserId,
            request.Receiver,
            request.Department,
            request.OrderNumber,
            request.Comment);

        var response = await _handler.HandleAsync(command);

        return Ok(response);
    }
}
using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Issue.Commands;
using AlmazManager.Application.Features.Issue.Handlers;
using AlmazManager.Contracts.Requests.Issue;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

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

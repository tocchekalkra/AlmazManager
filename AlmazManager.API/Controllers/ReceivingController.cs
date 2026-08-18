using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Receiving.Commands;
using AlmazManager.Application.Features.Receiving.Handlers;
using AlmazManager.Contracts.Requests.Receiving;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/receiving")]
[Authorize]
public sealed class ReceivingController : ControllerBase
{
    private readonly ReceiveMaterialHandler _handler;

    public ReceivingController(
        ReceiveMaterialHandler handler)
    {
        _handler = handler;
    }

    [HttpPost]
    public async Task<ActionResult<ReceivingResponse>> Receive(
        ReceivingRequest request)
    {
        var command = new ReceiveMaterialCommand(
            request.MaterialId,
            request.Quantity,
            request.UserId,
            request.Comment);

        var response = await _handler.HandleAsync(command);

        return Ok(response);
    }
}

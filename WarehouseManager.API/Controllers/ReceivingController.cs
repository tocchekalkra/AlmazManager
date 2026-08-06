using Microsoft.AspNetCore.Mvc;
using WarehouseManager.Application.Features.Receiving.Commands;
using WarehouseManager.Application.Features.Receiving.Handlers;
using WarehouseManager.Contracts.Requests.Receiving;
using WarehouseManager.Contracts.Responses;

namespace WarehouseManager.API.Controllers;

[ApiController]
[Route("api/receiving")]
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
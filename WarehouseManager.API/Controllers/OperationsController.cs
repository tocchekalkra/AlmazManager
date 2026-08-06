using Microsoft.AspNetCore.Mvc;
using WarehouseManager.Application.Features.Operations.Handlers;
using WarehouseManager.Contracts.Requests.Operations;
using WarehouseManager.Contracts.Responses;

namespace WarehouseManager.API.Controllers;

[ApiController]
[Route("api/operations")]
public sealed class OperationsController : ControllerBase
{
    private readonly GetOperationsHandler _getOperationsHandler;
    private readonly GetOperationCatalogHandler _getCatalogHandler;

    public OperationsController(
        GetOperationsHandler getOperationsHandler,
        GetOperationCatalogHandler getCatalogHandler)
    {
        _getOperationsHandler = getOperationsHandler;
        _getCatalogHandler = getCatalogHandler;
    }

    [HttpGet]
    public async Task<ActionResult<List<OperationResponse>>> GetAll()
    {
        var response =
            await _getOperationsHandler.HandleAsync();

        return Ok(response);
    }

    [HttpGet("catalog")]
    public async Task<ActionResult<OperationCatalogResponse>> GetCatalog(
        [FromQuery] OperationCatalogRequest request)
    {
        var response =
            await _getCatalogHandler.HandleAsync(request);

        return Ok(response);
    }
}
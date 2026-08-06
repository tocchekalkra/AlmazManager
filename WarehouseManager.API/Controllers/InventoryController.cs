using Microsoft.AspNetCore.Mvc;
using WarehouseManager.Application.Features.Inventory.Commands;
using WarehouseManager.Application.Features.Inventory.Handlers;
using WarehouseManager.Contracts.Requests.Inventory;
using WarehouseManager.Contracts.Responses.Inventory;

namespace WarehouseManager.API.Controllers;

[ApiController]
[Route("api/inventory")]
public sealed class InventoryController : ControllerBase
{
    private readonly InventoryAdjustmentHandler _adjustmentHandler;
    private readonly BulkInventoryHandler _bulkInventoryHandler;

    public InventoryController(
        InventoryAdjustmentHandler adjustmentHandler,
        BulkInventoryHandler bulkInventoryHandler)
    {
        _adjustmentHandler = adjustmentHandler;
        _bulkInventoryHandler = bulkInventoryHandler;
    }

    [HttpPost]
    public async Task<ActionResult<IssueInventoryResponse>> Adjust(
        [FromBody] IssueInventoryRequest request)
    {
        var command = new InventoryAdjustmentCommand(
            request.MaterialId,
            request.ActualQuantity,
            request.UserId,
            request.Comment);

        var response = await _adjustmentHandler.HandleAsync(command);

        return Ok(response);
    }

    [HttpPost("bulk")]
    public async Task<ActionResult<BulkInventoryResponse>> BulkAdjust(
        [FromBody] BulkInventoryRequest request)
    {
        var itemCommands = request.Items
            .Select(item => new BulkInventoryItemCommand(
                item.MaterialId,
                item.ActualQuantity,
                item.Comment))
            .ToList();

        var command = new BulkInventoryCommand(
            request.UserId,
            request.Comment,
            itemCommands);

        var response = await _bulkInventoryHandler.HandleAsync(command);

        return Ok(response);
    }
}
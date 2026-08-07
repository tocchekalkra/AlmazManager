using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.InventoryDocuments.Commands;
using AlmazManager.Application.Features.InventoryDocuments.Handlers;
using AlmazManager.Contracts.Requests.InventoryDocuments;
using AlmazManager.Contracts.Responses.InventoryDocuments;

namespace AlmazManager.API.Controllers;

[ApiController]
[Authorize]
[Route("api/inventory-documents")]
public sealed class InventoryDocumentsController :
    ControllerBase
{
    private readonly CreateInventoryDocumentHandler _createHandler;
    private readonly GetInventoryDocumentsHandler _getHandler;
    private readonly UpdateInventoryDocumentHandler _updateHandler;
    private readonly DeleteInventoryDocumentHandler _deleteHandler;
    private readonly PostInventoryDocumentHandler _postHandler;
    private readonly CancelInventoryDocumentHandler _cancelHandler;

    public InventoryDocumentsController(
        CreateInventoryDocumentHandler createHandler,
        GetInventoryDocumentsHandler getHandler,
        UpdateInventoryDocumentHandler updateHandler,
        DeleteInventoryDocumentHandler deleteHandler,
        PostInventoryDocumentHandler postHandler,
        CancelInventoryDocumentHandler cancelHandler)
    {
        _createHandler = createHandler;
        _getHandler = getHandler;
        _updateHandler = updateHandler;
        _deleteHandler = deleteHandler;
        _postHandler = postHandler;
        _cancelHandler = cancelHandler;
    }

    [HttpPost]
    public async Task<ActionResult<InventoryDocumentResponse>>
        Create(
            [FromBody]
            CreateInventoryDocumentRequest request)
    {
        var command =
            new CreateInventoryDocumentCommand(
                request.UserId,
                request.Comment,
                request.Items
                    .Select(x =>
                        new CreateInventoryDocumentItemCommand(
                            x.MaterialId,
                            x.ActualQuantity))
                    .ToList());

        var response =
            await _createHandler.HandleAsync(
                command);

        return Created(
            $"/api/inventory-documents/{response.Id}",
            response);
    }

    [HttpGet]
    public async Task<
        ActionResult<List<InventoryDocumentResponse>>>
        GetAll()
    {
        return Ok(
            await _getHandler.HandleAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InventoryDocumentResponse>>
        GetById(Guid id)
    {
        var response =
            await _getHandler.HandleByIdAsync(id);

        if (response is null)
        {
            return NotFound(new
            {
                message =
                    "Документ инвентаризации не найден."
            });
        }

        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<InventoryDocumentResponse>>
        Update(
            Guid id,
            [FromBody]
            UpdateInventoryDocumentRequest request)
    {
        var command =
            new UpdateInventoryDocumentCommand(
                id,
                request.Comment,
                request.Items
                    .Select(x =>
                        new UpdateInventoryDocumentItemCommand(
                            x.MaterialId,
                            x.ActualQuantity))
                    .ToList());

        return Ok(
            await _updateHandler.HandleAsync(
                command));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(
        Guid id)
    {
        await _deleteHandler.HandleAsync(id);

        return NoContent();
    }

    [HttpPost("{id:guid}/post")]
    public async Task<ActionResult<InventoryDocumentResponse>>
        Post(Guid id)
    {
        return Ok(
            await _postHandler.HandleAsync(id));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<InventoryDocumentResponse>>
        Cancel(Guid id)
    {
        return Ok(
            await _cancelHandler.HandleAsync(id));
    }
}

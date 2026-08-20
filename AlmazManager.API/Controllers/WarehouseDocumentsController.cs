using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using AlmazManager.Application.Features.Documents.Commands;
using AlmazManager.Application.Features.Documents.Handlers;
using AlmazManager.Contracts.Requests.Documents;
using AlmazManager.Contracts.Responses.Documents;

namespace AlmazManager.API.Controllers;

[ApiController]
[Authorize]
[Route("api/documents")]
public sealed class WarehouseDocumentsController :
    ControllerBase
{
    private readonly CreateWarehouseDocumentHandler
        _createHandler;

    private readonly GetWarehouseDocumentsHandler
        _getHandler;

    private readonly UpdateWarehouseDocumentHandler
        _updateHandler;

    private readonly DeleteWarehouseDocumentHandler
        _deleteHandler;

    private readonly PostWarehouseDocumentHandler
        _postHandler;

    private readonly CancelWarehouseDocumentHandler
        _cancelHandler;

    public WarehouseDocumentsController(
        CreateWarehouseDocumentHandler createHandler,
        GetWarehouseDocumentsHandler getHandler,
        UpdateWarehouseDocumentHandler updateHandler,
        DeleteWarehouseDocumentHandler deleteHandler,
        PostWarehouseDocumentHandler postHandler,
        CancelWarehouseDocumentHandler cancelHandler)
    {
        _createHandler =
            createHandler;

        _getHandler =
            getHandler;

        _updateHandler =
            updateHandler;

        _deleteHandler =
            deleteHandler;

        _postHandler =
            postHandler;

        _cancelHandler =
            cancelHandler;
    }

    [HttpPost]
    public async Task<ActionResult<WarehouseDocumentResponse>>
        Create(
            [FromBody]
            CreateWarehouseDocumentRequest request)
    {
        var command =
            new CreateWarehouseDocumentCommand(
                request.Type,
                request.DocumentDate ?? DateOnly.FromDateTime(DateTime.Now),
                request.SupplyInvoiceId,
                request.Supplier,
                request.ExternalNumber,
                request.Recipient,
                request.Comment,
                request.Items
                    .Select(x =>
                        new CreateWarehouseDocumentItemCommand(
                            x.MaterialId,
                            x.Quantity))
                    .ToList());

        var response =
            await _createHandler
                .HandleAsync(command);

        return Created(
            $"/api/documents/{response.Id}",
            response);
    }

    [HttpGet]
    public async Task<ActionResult<List<WarehouseDocumentResponse>>>
        GetAll()
    {
        return Ok(
            await _getHandler
                .HandleAsync());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WarehouseDocumentResponse>>
        GetById(Guid id)
    {
        var response =
            await _getHandler
                .HandleByIdAsync(id);

        if (response is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Документ не найден."
                });
        }

        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<WarehouseDocumentResponse>>
        Update(
            Guid id,
            [FromBody]
            UpdateWarehouseDocumentRequest request)
    {
        var command =
            new UpdateWarehouseDocumentCommand(
                id,
                request.DocumentDate,
                request.Supplier,
                request.ExternalNumber,
                request.Recipient,
                request.Comment,
                request.Items
                    .Select(x =>
                        new UpdateWarehouseDocumentItemCommand(
                            x.MaterialId,
                            x.Quantity))
                    .ToList());

        var response =
            await _updateHandler
                .HandleAsync(command);

        return Ok(response);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult>
        Delete(Guid id)
    {
        await _deleteHandler
            .HandleAsync(id);

        return NoContent();
    }

    [HttpPost("{id:guid}/post")]
    public async Task<ActionResult<WarehouseDocumentResponse>>
        Post(Guid id)
    {
        return Ok(
            await _postHandler
                .HandleAsync(id));
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<ActionResult<WarehouseDocumentResponse>>
        Cancel(Guid id)
    {
        return Ok(
            await _cancelHandler
                .HandleAsync(id));
    }
}

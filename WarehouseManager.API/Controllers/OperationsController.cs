using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WarehouseManager.Application.Features.Operations.Handlers;
using WarehouseManager.Contracts.Requests.Operations;
using WarehouseManager.Contracts.Responses;
using WarehouseManager.Contracts.Responses.Operations;

namespace WarehouseManager.API.Controllers;

[ApiController]
[Authorize]
[Route("api/operations")]
public sealed class OperationsController :
    ControllerBase
{
    private readonly GetOperationsHandler
        _getOperationsHandler;

    private readonly GetOperationCatalogHandler
        _getCatalogHandler;

    private readonly GetOperationJournalHandler
        _getJournalHandler;

    public OperationsController(
        GetOperationsHandler getOperationsHandler,
        GetOperationCatalogHandler getCatalogHandler,
        GetOperationJournalHandler getJournalHandler)
    {
        _getOperationsHandler =
            getOperationsHandler;

        _getCatalogHandler =
            getCatalogHandler;

        _getJournalHandler =
            getJournalHandler;
    }

    // Старый endpoint оставляем
    // для обратной совместимости.
    [HttpGet]
    public async Task<ActionResult<List<OperationResponse>>>
        GetAll()
    {
        return Ok(
            await _getOperationsHandler.HandleAsync());
    }

    // Старый каталог тоже оставляем.
    [HttpGet("catalog")]
    public async Task<ActionResult<OperationCatalogResponse>>
        GetCatalog(
            [FromQuery] OperationCatalogRequest request)
    {
        return Ok(
            await _getCatalogHandler.HandleAsync(
                request));
    }

    // Новый полноценный журнал.
    [HttpGet("journal")]
    public async Task<ActionResult<OperationJournalResponse>>
        GetJournal(
            [FromQuery] OperationJournalRequest request)
    {
        return Ok(
            await _getJournalHandler.HandleAsync(
                request));
    }

    [HttpGet("{id:guid}")]
    public async Task<
        ActionResult<OperationJournalItemResponse>>
        GetById(Guid id)
    {
        var response =
            await _getJournalHandler.HandleByIdAsync(
                id);

        if (response is null)
        {
            return NotFound(new
            {
                message =
                    "Складская операция не найдена."
            });
        }

        return Ok(response);
    }

    [HttpGet("material/{materialId:guid}")]
    public async Task<ActionResult<OperationJournalResponse>>
        GetByMaterial(Guid materialId)
    {
        var request =
            new OperationJournalRequest
            {
                MaterialId = materialId,
                Page = 1,
                PageSize = 200
            };

        return Ok(
            await _getJournalHandler.HandleAsync(
                request));
    }

    [HttpGet("document/{documentId:guid}")]
    public async Task<ActionResult<OperationJournalResponse>>
        GetByDocument(Guid documentId)
    {
        var request =
            new OperationJournalRequest
            {
                DocumentId = documentId,
                Page = 1,
                PageSize = 200
            };

        return Ok(
            await _getJournalHandler.HandleAsync(
                request));
    }
}
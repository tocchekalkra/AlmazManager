using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using AlmazManager.Application.Features.Materials.Commands;
using AlmazManager.Application.Features.Materials.Handlers;
using AlmazManager.Contracts.Requests.Materials;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/materials")]
[Authorize]
public sealed class MaterialsController : ControllerBase
{
    private readonly CreateMaterialHandler
        _createMaterialHandler;

    private readonly GetMaterialsHandler
        _getMaterialsHandler;

    private readonly GetMaterialCatalogHandler
        _getCatalogHandler;

    private readonly GetMaterialByIdHandler
        _getByIdHandler;

    private readonly UpdateMaterialHandler
        _updateMaterialHandler;

    private readonly SetMaterialActivityHandler
        _activityHandler;

    public MaterialsController(
        CreateMaterialHandler createMaterialHandler,
        GetMaterialsHandler getMaterialsHandler,
        GetMaterialCatalogHandler getCatalogHandler,
        GetMaterialByIdHandler getByIdHandler,
        UpdateMaterialHandler updateMaterialHandler,
        SetMaterialActivityHandler activityHandler)
    {
        _createMaterialHandler =
            createMaterialHandler;

        _getMaterialsHandler =
            getMaterialsHandler;

        _getCatalogHandler =
            getCatalogHandler;

        _getByIdHandler =
            getByIdHandler;

        _updateMaterialHandler =
            updateMaterialHandler;

        _activityHandler =
            activityHandler;
    }

    [HttpPost]
    public async Task<ActionResult<MaterialResponse>>
        Create(
            [FromBody]
            CreateMaterialRequest request)
    {
        var command =
            new CreateMaterialCommand(
                request.Name,
                request.Article,
                request.CategoryId,
                request.Unit,
                request.MinimumQuantity,
                request.Kind,
                request.WidthMeters,
                request.ColorCode,
                request.ColorName,
                request.ColorHex);

        var response =
            await _createMaterialHandler
                .HandleAsync(command);

        return Created(
            $"/api/materials/{response.Id}",
            response);
    }

    /*
     * Массовое создание обычного материала
     * сразу в нескольких ширинах.
     *
     * POST:
     * /api/materials/bulk-standard
     */
    [HttpPost("bulk-standard")]
    public async Task<ActionResult<List<MaterialResponse>>>
        CreateBulkStandard(
            [FromBody]
            CreateBulkStandardMaterialsRequest request)
    {
        var command =
            new CreateBulkStandardMaterialsCommand(
                request.Name,
                request.ArticlePrefix,
                request.CategoryId,
                request.MinimumQuantity,
                request.Widths);

        var response =
            await _createMaterialHandler
                .HandleBulkStandardAsync(
                    command);

        return Ok(response);
    }

    [HttpGet]
    public async Task<ActionResult<List<MaterialResponse>>>
        GetAll()
    {
        var response =
            await _getMaterialsHandler
                .HandleAsync();

        return Ok(response);
    }

    [HttpGet("catalog")]
    public async Task<ActionResult<MaterialCatalogResponse>>
        GetCatalog(
            [FromQuery]
            MaterialCatalogRequest request)
    {
        var response =
            await _getCatalogHandler
                .HandleAsync(request);

        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<MaterialResponse>>
        GetById(Guid id)
    {
        var response =
            await _getByIdHandler
                .HandleAsync(id);

        if (response is null)
        {
            return NotFound(
                new
                {
                    message =
                        "Материал не найден."
                });
        }

        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<MaterialResponse>>
        Update(
            Guid id,
            [FromBody]
            UpdateMaterialRequest request)
    {
        var command =
            new UpdateMaterialCommand(
                id,
                request.Name,
                request.Article,
                request.CategoryId,
                request.Unit,
                request.MinimumQuantity,
                request.Kind,
                request.WidthMeters,
                request.ColorCode,
                request.ColorName,
                request.ColorHex);

        var response =
            await _updateMaterialHandler
                .HandleAsync(command);

        return Ok(response);
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult<MaterialResponse>>
        Archive(Guid id)
    {
        var command =
            new SetMaterialActivityCommand(
                id,
                false);

        var response =
            await _activityHandler
                .HandleAsync(command);

        return Ok(response);
    }

    [HttpPatch("{id:guid}/restore")]
    public async Task<ActionResult<MaterialResponse>>
        Restore(Guid id)
    {
        var command =
            new SetMaterialActivityCommand(
                id,
                true);

        var response =
            await _activityHandler
                .HandleAsync(command);

        return Ok(response);
    }
}
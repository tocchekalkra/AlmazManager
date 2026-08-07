using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Categories.Commands;
using AlmazManager.Application.Features.Categories.Handlers;
using AlmazManager.Contracts.Requests.Categories;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly CreateCategoryHandler _createHandler;
    private readonly GetCategoriesHandler _getAllHandler;
    private readonly GetCategoryByIdHandler _getByIdHandler;
    private readonly UpdateCategoryHandler _updateHandler;
    private readonly SetCategoryActivityHandler _activityHandler;

    public CategoriesController(
        CreateCategoryHandler createHandler,
        GetCategoriesHandler getAllHandler,
        GetCategoryByIdHandler getByIdHandler,
        UpdateCategoryHandler updateHandler,
        SetCategoryActivityHandler activityHandler)
    {
        _createHandler = createHandler;
        _getAllHandler = getAllHandler;
        _getByIdHandler = getByIdHandler;
        _updateHandler = updateHandler;
        _activityHandler = activityHandler;
    }

    [HttpPost]
    public async Task<ActionResult<CategoryResponse>> Create(
        [FromBody] CreateCategoryRequest request)
    {
        var command = new CreateCategoryCommand(request.Name);

        var response = await _createHandler.HandleAsync(command);

        return Created(
            $"/api/categories/{response.Id}",
            response);
    }

    [HttpGet]
    public async Task<ActionResult<List<CategoryResponse>>> GetAll()
    {
        var response = await _getAllHandler.HandleAsync();

        return Ok(response);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CategoryResponse>> GetById(Guid id)
    {
        var response = await _getByIdHandler.HandleAsync(id);

        if (response is null)
        {
            return NotFound(new
            {
                message = "Категория не найдена."
            });
        }

        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CategoryResponse>> Update(
        Guid id,
        [FromBody] UpdateCategoryRequest request)
    {
        var command = new UpdateCategoryCommand(
            id,
            request.Name);

        var response = await _updateHandler.HandleAsync(command);

        return Ok(response);
    }

    [HttpPatch("{id:guid}/archive")]
    public async Task<ActionResult<CategoryResponse>> Archive(Guid id)
    {
        var command = new SetCategoryActivityCommand(
            id,
            false);

        var response = await _activityHandler.HandleAsync(command);

        return Ok(response);
    }

    [HttpPatch("{id:guid}/restore")]
    public async Task<ActionResult<CategoryResponse>> Restore(Guid id)
    {
        var command = new SetCategoryActivityCommand(
            id,
            true);

        var response = await _activityHandler.HandleAsync(command);

        return Ok(response);
    }
}

using AlmazManager.Application.Features.Users.Commands;
using AlmazManager.Application.Features.Users.Handlers;
using AlmazManager.Contracts.Requests.Users;
using AlmazManager.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly RegisterUserHandler _registerHandler;
    private readonly GetUsersHandler _getUsersHandler;
    private readonly GetUserCategoryAccessesHandler
        _getCategoryAccessesHandler;
    private readonly UpdateUserCategoryAccessesHandler
        _updateCategoryAccessesHandler;

    public UsersController(
        RegisterUserHandler registerHandler,
        GetUsersHandler getUsersHandler,
        GetUserCategoryAccessesHandler getCategoryAccessesHandler,
        UpdateUserCategoryAccessesHandler updateCategoryAccessesHandler)
    {
        _registerHandler = registerHandler;
        _getUsersHandler = getUsersHandler;
        _getCategoryAccessesHandler =
            getCategoryAccessesHandler;
        _updateCategoryAccessesHandler =
            updateCategoryAccessesHandler;
    }

    [HttpPost("register")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<UserResponse>> Register(
        [FromBody] RegisterUserRequest request)
    {
        var command = new RegisterUserCommand(
            request.FullName,
            request.Login,
            request.Password,
            request.Role);

        var response =
            await _registerHandler.HandleAsync(command);

        return Created(
            $"/api/users/{response.Id}",
            response);
    }

    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        var response =
            await _getUsersHandler.HandleAsync();

        return Ok(response);
    }

    [HttpGet("{userId:guid}/category-access")]
    [Authorize(Roles = "Administrator")]
    public async Task<
        ActionResult<List<UserCategoryAccessResponse>>>
        GetCategoryAccess(Guid userId)
    {
        var response =
            await _getCategoryAccessesHandler
                .HandleAsync(userId);

        return Ok(response);
    }

    [HttpPut("{userId:guid}/category-access")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UpdateCategoryAccess(
        Guid userId,
        [FromBody]
        UpdateUserCategoryAccessesRequest request)
    {
        await _updateCategoryAccessesHandler
            .HandleAsync(userId, request);

        return NoContent();
    }
}
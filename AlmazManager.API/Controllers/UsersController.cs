using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Users.Commands;
using AlmazManager.Application.Features.Users.Handlers;
using AlmazManager.Contracts.Requests.Users;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly RegisterUserHandler _registerHandler;
    private readonly GetUsersHandler _getUsersHandler;

    public UsersController(
        RegisterUserHandler registerHandler,
        GetUsersHandler getUsersHandler)
    {
        _registerHandler = registerHandler;
        _getUsersHandler = getUsersHandler;
    }

    [HttpPost("register")]
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
    public async Task<ActionResult<List<UserResponse>>> GetAll()
    {
        var response =
            await _getUsersHandler.HandleAsync();

        return Ok(response);
    }
}

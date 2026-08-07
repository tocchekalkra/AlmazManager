using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Authentication.Commands;
using AlmazManager.Application.Features.Authentication.Handlers;
using AlmazManager.Contracts.Requests.Authentication;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly LoginUserHandler _loginHandler;

    public AuthController(
        LoginUserHandler loginHandler)
    {
        _loginHandler = loginHandler;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        [FromBody] LoginRequest request)
    {
        var command = new LoginUserCommand(
            request.Login,
            request.Password);

        var response =
            await _loginHandler.HandleAsync(command);

        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        var fullName = User.FindFirstValue(
            ClaimTypes.Name);

        var role = User.FindFirstValue(
            ClaimTypes.Role);

        var login = User.FindFirstValue("login");

        return Ok(new
        {
            userId,
            fullName,
            login,
            role
        });
    }
}

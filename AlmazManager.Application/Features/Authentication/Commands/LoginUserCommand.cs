namespace AlmazManager.Application.Features.Authentication.Commands;

public sealed record LoginUserCommand(
    string Login,
    string Password);

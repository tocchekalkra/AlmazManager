namespace AlmazManager.Application.Features.Users.Commands;

public sealed record RegisterUserCommand(
    string FullName,
    string Login,
    string Password,
    string Role);

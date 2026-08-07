namespace AlmazManager.Contracts.Requests.Authentication;

public sealed record LoginRequest(
    string Login,
    string Password);

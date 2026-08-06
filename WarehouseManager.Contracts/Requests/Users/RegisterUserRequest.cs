namespace WarehouseManager.Contracts.Requests.Users;

public sealed record RegisterUserRequest(
    string FullName,
    string Login,
    string Password,
    string Role);
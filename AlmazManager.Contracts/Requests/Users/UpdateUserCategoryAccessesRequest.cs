namespace AlmazManager.Contracts.Requests.Users;

public sealed record UpdateUserCategoryAccessesRequest(
    List<UpdateUserCategoryAccessRequest> Accesses);
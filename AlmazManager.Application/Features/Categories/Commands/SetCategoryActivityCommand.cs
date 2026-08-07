namespace AlmazManager.Application.Features.Categories.Commands;

public sealed record SetCategoryActivityCommand(
    Guid CategoryId,
    bool IsActive);

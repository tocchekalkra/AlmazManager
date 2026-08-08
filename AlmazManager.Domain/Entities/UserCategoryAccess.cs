namespace AlmazManager.Domain.Entities;

public sealed class UserCategoryAccess : BaseEntity
{
    private UserCategoryAccess()
    {
    }

    public UserCategoryAccess(
        Guid userId,
        Guid categoryId,
        bool canView,
        bool canReceive,
        bool canIssue,
        bool canInventory)
    {
        ChangeUser(userId);
        ChangeCategory(categoryId);
        ChangePermissions(
            canView,
            canReceive,
            canIssue,
            canInventory);
    }

    public Guid UserId { get; private set; }

    public Guid CategoryId { get; private set; }

    public bool CanView { get; private set; }

    public bool CanReceive { get; private set; }

    public bool CanIssue { get; private set; }

    public bool CanInventory { get; private set; }

    public void ChangeUser(Guid userId)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException(
                "Пользователь не указан.",
                nameof(userId));
        }

        UserId = userId;
    }

    public void ChangeCategory(Guid categoryId)
    {
        if (categoryId == Guid.Empty)
        {
            throw new ArgumentException(
                "Категория не указана.",
                nameof(categoryId));
        }

        CategoryId = categoryId;
    }

    public void ChangePermissions(
        bool canView,
        bool canReceive,
        bool canIssue,
        bool canInventory)
    {
        CanView = canView;
        CanReceive = canReceive;
        CanIssue = canIssue;
        CanInventory = canInventory;
    }

    public void Archive()
    {
        IsActive = false;
    }

    public void Restore()
    {
        IsActive = true;
    }
}
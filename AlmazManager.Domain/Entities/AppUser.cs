using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

public sealed class AppUser : BaseEntity
{
    private AppUser()
    {
    }

    public AppUser(
        string fullName,
        string login,
        UserRole role)
    {
        ChangeFullName(fullName);
        ChangeLogin(login);
        ChangeRole(role);
    }

    public string FullName { get; private set; } = string.Empty;

    public string Login { get; private set; } = string.Empty;

    public string PasswordHash { get; private set; } = string.Empty;

    public UserRole Role { get; private set; }

    public bool CanManageMaterials { get; private set; }

    public bool CanArchiveMaterials { get; private set; }

    public bool CanRestoreMaterials { get; private set; }

    public bool CanPermanentlyDeleteMaterials { get; private set; }

    public bool CanCancelDocuments { get; private set; }

    public bool CanManageSupplies { get; private set; }

    public void ChangeFullName(string fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException(
                "Имя пользователя не может быть пустым.",
                nameof(fullName));
        }

        FullName = fullName.Trim();
    }

    public void ChangeLogin(string login)
    {
        if (string.IsNullOrWhiteSpace(login))
        {
            throw new ArgumentException(
                "Логин не может быть пустым.",
                nameof(login));
        }

        var normalizedLogin = login.Trim().ToLowerInvariant();

        if (normalizedLogin.Length < 3)
        {
            throw new ArgumentException(
                "Логин должен содержать минимум 3 символа.",
                nameof(login));
        }

        Login = normalizedLogin;
    }

    public void ChangePasswordHash(string passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            throw new ArgumentException(
                "Хеш пароля не может быть пустым.",
                nameof(passwordHash));
        }

        PasswordHash = passwordHash;
    }

    public void ChangeRole(UserRole role)
    {
        if (!Enum.IsDefined(role))
        {
            throw new ArgumentOutOfRangeException(
                nameof(role),
                "Неизвестная роль пользователя.");
        }

        Role = role;
    }

    public void ChangeSystemPermissions(
        bool canManageMaterials,
        bool canArchiveMaterials,
        bool canRestoreMaterials,
        bool canPermanentlyDeleteMaterials,
        bool canCancelDocuments,
        bool canManageSupplies)
    {
        CanManageMaterials = canManageMaterials;
        CanArchiveMaterials = canArchiveMaterials;
        CanRestoreMaterials = canRestoreMaterials;
        CanPermanentlyDeleteMaterials = canPermanentlyDeleteMaterials;
        CanCancelDocuments = canCancelDocuments;
        CanManageSupplies = canManageSupplies;
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

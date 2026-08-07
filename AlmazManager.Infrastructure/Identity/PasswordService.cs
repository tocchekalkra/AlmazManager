using Microsoft.AspNetCore.Identity;
using AlmazManager.Application.Interfaces;
using AlmazManager.Domain.Entities;

namespace AlmazManager.Infrastructure.Identity;

public sealed class PasswordService : IPasswordService
{
    private readonly PasswordHasher<AppUser> _passwordHasher = new();

    public string HashPassword(
        AppUser user,
        string password)
    {
        ValidatePassword(password);

        return _passwordHasher.HashPassword(
            user,
            password);
    }

    public bool VerifyPassword(
        AppUser user,
        string passwordHash,
        string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            return false;
        }

        var result = _passwordHasher.VerifyHashedPassword(
            user,
            passwordHash,
            password);

        return result is
            PasswordVerificationResult.Success
            or PasswordVerificationResult.SuccessRehashNeeded;
    }

    private static void ValidatePassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            throw new ArgumentException(
                "Пароль не может быть пустым.",
                nameof(password));
        }

        if (password.Length < 8)
        {
            throw new ArgumentException(
                "Пароль должен содержать минимум 8 символов.",
                nameof(password));
        }

        if (!password.Any(char.IsLetter))
        {
            throw new ArgumentException(
                "Пароль должен содержать хотя бы одну букву.",
                nameof(password));
        }

        if (!password.Any(char.IsDigit))
        {
            throw new ArgumentException(
                "Пароль должен содержать хотя бы одну цифру.",
                nameof(password));
        }
    }
}

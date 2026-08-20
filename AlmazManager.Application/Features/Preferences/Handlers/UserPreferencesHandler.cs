using AlmazManager.Application.Interfaces;
using AlmazManager.Contracts.Requests.Preferences;
using AlmazManager.Contracts.Responses.Preferences;
using AlmazManager.Domain.Entities;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Preferences.Handlers;

public sealed class UserPreferencesHandler
{
    private readonly IUserPreferenceRepository _repository;
    private readonly ICurrentUserService _currentUserService;

    public UserPreferencesHandler(
        IUserPreferenceRepository repository,
        ICurrentUserService currentUserService)
    {
        _repository = repository;
        _currentUserService = currentUserService;
    }

    public async Task<UserPreferencesResponse> GetAsync()
    {
        var preference = await GetOrCreateAsync();
        return Map(preference);
    }

    public async Task<UserPreferencesResponse> UpdateAsync(UpdatePreferencesRequest request)
    {
        var preference = await GetOrCreateAsync();

        if (!string.IsNullOrWhiteSpace(request.Theme))
        {
            if (!Enum.TryParse<UserTheme>(request.Theme, true, out var theme))
                throw new ArgumentException("Неизвестная тема оформления.");

            preference.ChangeTheme(theme);
        }

        if (request.ResetOrder)
            preference.ResetOrder();

        if (request.MaterialOrder is not null)
            preference.ChangeMaterialOrder(request.MaterialOrder);

        if (request.CategoryOrder is not null)
            preference.ChangeCategoryOrder(request.CategoryOrder);

        await _repository.SaveChangesAsync();
        return Map(preference);
    }

    private async Task<UserPreference> GetOrCreateAsync()
    {
        var preference = await _repository.GetByUserIdAsync(_currentUserService.UserId);

        if (preference is not null)
            return preference;

        preference = new UserPreference(_currentUserService.UserId);
        await _repository.AddAsync(preference);
        await _repository.SaveChangesAsync();
        return preference;
    }

    private static UserPreferencesResponse Map(UserPreference preference) =>
        new(
            preference.Theme.ToString(),
            preference.MaterialOrder,
            preference.CategoryOrder);
}

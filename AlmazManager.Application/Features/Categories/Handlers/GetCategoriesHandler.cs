using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Categories.Handlers;

public sealed class GetCategoriesHandler
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICategoryAccessService _categoryAccessService;
    private readonly IUserPreferenceRepository _preferenceRepository;
    private readonly ICurrentUserService _currentUserService;

    public GetCategoriesHandler(
        ICategoryRepository categoryRepository,
        ICategoryAccessService categoryAccessService,
        IUserPreferenceRepository preferenceRepository,
        ICurrentUserService currentUserService)
    {
        _categoryRepository = categoryRepository;
        _categoryAccessService = categoryAccessService;
        _preferenceRepository = preferenceRepository;
        _currentUserService = currentUserService;
    }

    public async Task<List<CategoryResponse>> HandleAsync()
    {
        var categories =
            await _categoryRepository.GetAllAsync();

        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            categories = categories
                .Where(category => allowedCategoryIds.Contains(category.Id))
                .ToList();
        }

        var preference = await _preferenceRepository.GetByUserIdAsync(_currentUserService.UserId);
        var order = (preference?.CategoryOrder ?? [])
            .Select((id, index) => new { id, index })
            .ToDictionary(x => x.id, x => x.index);

        return categories
            .OrderBy(category => order.GetValueOrDefault(category.Id, int.MaxValue))
            .ThenBy(category => category.Name)
            .Select(x => new CategoryResponse(
                x.Id,
                x.Name,
                x.IsActive))
            .ToList();
    }
}

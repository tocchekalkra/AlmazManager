using AlmazManager.Application.Features.Users.Commands;
using AlmazManager.Application.Features.Users.Handlers;
using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Application.Features.Preferences.Handlers;
using AlmazManager.Contracts.Requests.Users;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Enums;
using AlmazManager.Domain.Interfaces;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly RegisterUserHandler
        _registerHandler;

    private readonly GetUsersHandler
        _getUsersHandler;

    private readonly GetUserCategoryAccessesHandler
        _getCategoryAccessesHandler;

    private readonly UpdateUserCategoryAccessesHandler
        _updateCategoryAccessesHandler;

    private readonly ICategoryAccessService
        _categoryAccessService;

    private readonly UpdateUserSystemPermissionsHandler
        _updateSystemPermissionsHandler;

    private readonly ICurrentUserService
        _currentUserService;

    private readonly IUserRepository
        _userRepository;

    private readonly UserPreferencesHandler
        _preferencesHandler;

    public UsersController(
        RegisterUserHandler registerHandler,
        GetUsersHandler getUsersHandler,
        GetUserCategoryAccessesHandler getCategoryAccessesHandler,
        UpdateUserCategoryAccessesHandler updateCategoryAccessesHandler,
        ICategoryAccessService categoryAccessService,
        UpdateUserSystemPermissionsHandler updateSystemPermissionsHandler,
        ICurrentUserService currentUserService,
        IUserRepository userRepository,
        UserPreferencesHandler preferencesHandler)
    {
        _registerHandler =
            registerHandler;

        _getUsersHandler =
            getUsersHandler;

        _getCategoryAccessesHandler =
            getCategoryAccessesHandler;

        _updateCategoryAccessesHandler =
            updateCategoryAccessesHandler;

        _categoryAccessService =
            categoryAccessService;

        _updateSystemPermissionsHandler = updateSystemPermissionsHandler;
        _currentUserService = currentUserService;
        _userRepository = userRepository;
        _preferencesHandler = preferencesHandler;
    }

    /*
     * Права текущего пользователя.
     *
     * Этот endpoint доступен любому
     * авторизованному пользователю.
     *
     * Он нужен frontend для построения
     * доступного меню.
     */
    [HttpGet("me/access")]
    public async Task<
        ActionResult<CurrentUserAccessResponse>>
        GetCurrentUserAccess()
    {
        var standardCategories =
            await _categoryAccessService
                .GetAllowedCategoryIdsAsync(
                    CategoryPermission.InventoryStandard);

        var oracalCategories =
            await _categoryAccessService
                .GetAllowedCategoryIdsAsync(
                    CategoryPermission.InventoryOracal);

        /*
         * null означает администратора:
         * ему доступны все категории.
         *
         * Для обычного пользователя
         * достаточно хотя бы одной
         * разрешённой категории.
         */
        var canInventoryStandard =
            standardCategories is null ||
            standardCategories.Count > 0;

        var canInventoryOracal =
            oracalCategories is null ||
            oracalCategories.Count > 0;

        var user = await _userRepository.GetByIdAsync(_currentUserService.UserId)
            ?? throw new InvalidOperationException("Текущий пользователь не найден.");
        var administrator = user.Role == UserRole.Administrator;
        var preferences = await _preferencesHandler.GetAsync();

        return Ok(
            new CurrentUserAccessResponse(
                canInventoryStandard,
                canInventoryOracal,
                administrator || user.CanManageMaterials,
                administrator || user.CanArchiveMaterials,
                administrator || user.CanRestoreMaterials,
                administrator || user.CanPermanentlyDeleteMaterials,
                administrator || user.CanCancelDocuments,
                administrator || user.CanManageSupplies,
                preferences.Theme));
    }

    [HttpPost("register")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<UserResponse>>
        Register(
            [FromBody]
            RegisterUserRequest request)
    {
        var command =
            new RegisterUserCommand(
                request.FullName,
                request.Login,
                request.Password,
                request.Role);

        var response =
            await _registerHandler
                .HandleAsync(command);

        return Created(
            $"/api/users/{response.Id}",
            response);
    }

    [HttpGet]
    [Authorize(Roles = "Administrator")]
    public async Task<
        ActionResult<List<UserResponse>>>
        GetAll()
    {
        var response =
            await _getUsersHandler
                .HandleAsync();

        return Ok(response);
    }

    [HttpGet("{userId:guid}/category-access")]
    [Authorize(Roles = "Administrator")]
    public async Task<
        ActionResult<List<UserCategoryAccessResponse>>>
        GetCategoryAccess(
            Guid userId)
    {
        var response =
            await _getCategoryAccessesHandler
                .HandleAsync(
                    userId);

        return Ok(response);
    }

    [HttpPut("{userId:guid}/category-access")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult>
        UpdateCategoryAccess(
            Guid userId,
            [FromBody]
            UpdateUserCategoryAccessesRequest request)
    {
        await _updateCategoryAccessesHandler
            .HandleAsync(
                userId,
                request);

        return NoContent();
    }

    [HttpPut("{userId:guid}/system-access")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> UpdateSystemAccess(
        Guid userId,
        [FromBody] UpdateUserSystemPermissionsRequest request)
    {
        await _updateSystemPermissionsHandler.HandleAsync(userId, request);
        return NoContent();
    }
}

using AlmazManager.Application.Features.Preferences.Handlers;
using AlmazManager.Contracts.Requests.Preferences;
using AlmazManager.Contracts.Responses.Preferences;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlmazManager.API.Controllers;

[ApiController]
[Authorize]
[Route("api/preferences")]
public sealed class PreferencesController : ControllerBase
{
    private readonly UserPreferencesHandler _handler;

    public PreferencesController(UserPreferencesHandler handler)
    {
        _handler = handler;
    }

    [HttpGet]
    public async Task<ActionResult<UserPreferencesResponse>> Get() =>
        Ok(await _handler.GetAsync());

    [HttpPut]
    public async Task<ActionResult<UserPreferencesResponse>> Update(
        [FromBody] UpdatePreferencesRequest request) =>
        Ok(await _handler.UpdateAsync(request));
}

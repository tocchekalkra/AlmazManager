using AlmazManager.Application.Features.Supplies.Handlers;
using AlmazManager.Contracts.Requests.Supplies;
using AlmazManager.Contracts.Responses.Supplies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AlmazManager.API.Controllers;

[ApiController]
[Authorize]
[Route("api/supplies")]
public sealed class SuppliesController : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions =
        new(StringComparer.OrdinalIgnoreCase) { ".pdf", ".jpg", ".jpeg", ".png", ".webp" };

    private readonly SupplyInvoiceHandler _handler;
    private readonly IWebHostEnvironment _environment;

    public SuppliesController(
        SupplyInvoiceHandler handler,
        IWebHostEnvironment environment)
    {
        _handler = handler;
        _environment = environment;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SupplyInvoiceResponse>>> GetAll() =>
        Ok(await _handler.GetAllAsync());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SupplyInvoiceResponse>> GetById(Guid id)
    {
        var response = await _handler.GetByIdAsync(id);
        return response is null
            ? NotFound(new { message = "Счёт не найден." })
            : Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<SupplyInvoiceResponse>> Create(
        [FromBody] UpsertSupplyInvoiceRequest request)
    {
        var response = await _handler.CreateAsync(request);
        return Created($"/api/supplies/{response.Id}", response);
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<SupplyInvoiceResponse>> Update(
        Guid id,
        [FromBody] UpsertSupplyInvoiceRequest request) =>
        Ok(await _handler.UpdateAsync(id, request));

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<SupplyInvoiceResponse>> ChangeStatus(
        Guid id,
        [FromBody] UpdateSupplyInvoiceStatusRequest request) =>
        Ok(await _handler.ChangeStatusAsync(id, request.Status));

    [HttpPost("{id:guid}/attachment")]
    [RequestSizeLimit(10_000_000)]
    public async Task<ActionResult<SupplyInvoiceResponse>> UploadAttachment(
        Guid id,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (await _handler.GetByIdAsync(id) is null)
            return NotFound(new { message = "Счёт не найден." });

        if (file.Length == 0)
            throw new ArgumentException("Файл пуст.");

        if (file.Length > 10_000_000)
            throw new ArgumentException("Размер файла не должен превышать 10 МБ.");

        var extension = Path.GetExtension(file.FileName);

        if (!AllowedExtensions.Contains(extension))
            throw new ArgumentException("Разрешены PDF, JPG, PNG и WEBP.");

        var webRoot = _environment.WebRootPath
            ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var directory = Path.Combine(webRoot, "uploads", "invoices");
        Directory.CreateDirectory(directory);

        var fileName = $"{id:N}-{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var absolutePath = Path.Combine(directory, fileName);

        await using (var stream = System.IO.File.Create(absolutePath))
            await file.CopyToAsync(stream, cancellationToken);

        return Ok(await _handler.SetAttachmentAsync(
            id,
            $"/uploads/invoices/{fileName}"));
    }
}

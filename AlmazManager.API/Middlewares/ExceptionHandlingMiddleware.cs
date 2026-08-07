using Microsoft.EntityFrameworkCore;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Middlewares;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ArgumentException exception)
        {
            await WriteErrorAsync(
                context,
                StatusCodes.Status400BadRequest,
                exception.Message);
        }
        catch (InvalidOperationException exception)
        {
            await WriteErrorAsync(
                context,
                ResolveInvalidOperationStatus(exception.Message),
                exception.Message);
        }
        catch (DbUpdateException exception)
        {
            _logger.LogWarning(
                exception,
                "Ошибка сохранения данных в базе.");

            await WriteErrorAsync(
                context,
                ResolveDatabaseStatus(exception),
                ResolveDatabaseMessage(exception));
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "Необработанная ошибка API.");

            await WriteErrorAsync(
                context,
                StatusCodes.Status500InternalServerError,
                "Внутренняя ошибка сервера.");
        }
    }

    private static int ResolveInvalidOperationStatus(string message)
    {
        if (message.Contains(
                "не найден",
                StringComparison.OrdinalIgnoreCase))
        {
            return StatusCodes.Status404NotFound;
        }

        if (message.Contains(
                "недостаточно",
                StringComparison.OrdinalIgnoreCase))
        {
            return StatusCodes.Status409Conflict;
        }

        if (message.Contains(
                "нельзя",
                StringComparison.OrdinalIgnoreCase))
        {
            return StatusCodes.Status409Conflict;
        }

        return StatusCodes.Status400BadRequest;
    }

    private static int ResolveDatabaseStatus(
        DbUpdateException exception)
    {
        var message = GetFullExceptionMessage(exception);

        if (message.Contains(
                "duplicate key",
                StringComparison.OrdinalIgnoreCase)
            ||
            message.Contains(
                "unique constraint",
                StringComparison.OrdinalIgnoreCase))
        {
            return StatusCodes.Status409Conflict;
        }

        if (message.Contains(
                "foreign key",
                StringComparison.OrdinalIgnoreCase))
        {
            return StatusCodes.Status400BadRequest;
        }

        return StatusCodes.Status500InternalServerError;
    }

    private static string ResolveDatabaseMessage(
        DbUpdateException exception)
    {
        var message = GetFullExceptionMessage(exception);

        if (message.Contains(
                "IX_Materials_Article",
                StringComparison.OrdinalIgnoreCase))
        {
            return "Материал с таким артикулом уже существует.";
        }

        if (message.Contains(
                "IX_Categories_Name",
                StringComparison.OrdinalIgnoreCase))
        {
            return "Категория с таким названием уже существует.";
        }

        if (message.Contains(
                "duplicate key",
                StringComparison.OrdinalIgnoreCase)
            ||
            message.Contains(
                "unique constraint",
                StringComparison.OrdinalIgnoreCase))
        {
            return "Запись с такими уникальными данными уже существует.";
        }

        if (message.Contains(
                "foreign key",
                StringComparison.OrdinalIgnoreCase))
        {
            return "Невозможно сохранить данные: связанный объект не найден.";
        }

        return "Не удалось сохранить изменения в базе данных.";
    }

    private static string GetFullExceptionMessage(
        Exception exception)
    {
        var messages = new List<string>();

        Exception? currentException = exception;

        while (currentException is not null)
        {
            messages.Add(currentException.Message);
            currentException = currentException.InnerException;
        }

        return string.Join(" ", messages);
    }

    private static async Task WriteErrorAsync(
        HttpContext context,
        int statusCode,
        string message)
    {
        if (context.Response.HasStarted)
        {
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var response = new ErrorResponse(
            statusCode,
            message,
            DateTime.UtcNow);

        await context.Response.WriteAsJsonAsync(response);
    }
}

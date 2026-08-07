using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using AlmazManager.Contracts.Responses.Lookups;
using AlmazManager.Domain.Enums;

namespace AlmazManager.API.Controllers;

[ApiController]
[Authorize]
[Route("api/lookups")]
public sealed class LookupsController :
    ControllerBase
{
    [HttpGet("measurement-units")]
    public ActionResult<List<MeasurementUnitResponse>>
        GetMeasurementUnits()
    {
        var units =
            Enum.GetValues<MeasurementUnit>()
                .Select(unit =>
                    new MeasurementUnitResponse(
                        (int)unit,
                        unit.ToString(),
                        GetName(unit),
                        GetShortName(unit)))
                .ToList();

        return Ok(units);
    }

    private static string GetName(
        MeasurementUnit unit)
    {
        return unit switch
        {
            MeasurementUnit.Piece => "Штука",
            MeasurementUnit.Meter => "Метр",
            MeasurementUnit.SquareMeter => "Квадратный метр",
            MeasurementUnit.Kilogram => "Килограмм",
            MeasurementUnit.Liter => "Литр",
            MeasurementUnit.Roll => "Рулон",
            MeasurementUnit.Sheet => "Лист",
            _ => unit.ToString()
        };
    }

    private static string GetShortName(
        MeasurementUnit unit)
    {
        return unit switch
        {
            MeasurementUnit.Piece => "шт.",
            MeasurementUnit.Meter => "м",
            MeasurementUnit.SquareMeter => "м²",
            MeasurementUnit.Kilogram => "кг",
            MeasurementUnit.Liter => "л",
            MeasurementUnit.Roll => "рул.",
            MeasurementUnit.Sheet => "лист",
            _ => unit.ToString()
        };
    }
}

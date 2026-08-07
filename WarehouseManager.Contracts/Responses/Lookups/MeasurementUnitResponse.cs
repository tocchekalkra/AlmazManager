namespace WarehouseManager.Contracts.Responses.Lookups;

public sealed record MeasurementUnitResponse(
    int Id,
    string Code,
    string Name,
    string ShortName);
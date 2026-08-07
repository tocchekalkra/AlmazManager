using Microsoft.AspNetCore.Mvc;
using AlmazManager.Application.Features.Stocks.Handlers;
using AlmazManager.Contracts.Requests.Stocks;
using AlmazManager.Contracts.Responses;

namespace AlmazManager.API.Controllers;

[ApiController]
[Route("api/stocks")]
public sealed class StocksController : ControllerBase
{
    private readonly GetStocksHandler _getStocksHandler;
    private readonly GetStockCatalogHandler _getCatalogHandler;

    public StocksController(
        GetStocksHandler getStocksHandler,
        GetStockCatalogHandler getCatalogHandler)
    {
        _getStocksHandler = getStocksHandler;
        _getCatalogHandler = getCatalogHandler;
    }

    [HttpGet]
    public async Task<ActionResult<List<StockResponse>>> GetAll()
    {
        var response =
            await _getStocksHandler.HandleAsync();

        return Ok(response);
    }

    [HttpGet("catalog")]
    public async Task<ActionResult<StockCatalogResponse>> GetCatalog(
        [FromQuery] StockCatalogRequest request)
    {
        var response =
            await _getCatalogHandler.HandleAsync(request);

        return Ok(response);
    }
}

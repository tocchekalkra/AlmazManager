using WarehouseManager.Contracts.Responses;
using WarehouseManager.Domain.Interfaces;

namespace WarehouseManager.Application.Features.Stocks.Handlers;

public sealed class GetStocksHandler
{
    private readonly IStockRepository _stockRepository;

    public GetStocksHandler(IStockRepository stockRepository)
    {
        _stockRepository = stockRepository;
    }

    public async Task<List<StockResponse>> HandleAsync()
    {
        var stocks = await _stockRepository.GetAllAsync();

        return stocks
            .Select(stock => new StockResponse(
                stock.Id,
                stock.MaterialId,
                stock.Quantity,
                stock.UpdatedAtUtc))
            .ToList();
    }
}
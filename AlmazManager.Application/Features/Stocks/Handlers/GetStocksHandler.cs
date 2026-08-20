using AlmazManager.Application.Interfaces;
using AlmazManager.Application.Security;
using AlmazManager.Contracts.Responses;
using AlmazManager.Domain.Interfaces;

namespace AlmazManager.Application.Features.Stocks.Handlers;

public sealed class GetStocksHandler
{
    private readonly IStockRepository _stockRepository;
    private readonly IMaterialRepository _materialRepository;
    private readonly ICategoryAccessService _categoryAccessService;

    public GetStocksHandler(
        IStockRepository stockRepository,
        IMaterialRepository materialRepository,
        ICategoryAccessService categoryAccessService)
    {
        _stockRepository = stockRepository;
        _materialRepository = materialRepository;
        _categoryAccessService = categoryAccessService;
    }

    public async Task<List<StockResponse>> HandleAsync()
    {
        var stocks = await _stockRepository.GetAllAsync();
        var materials = await _materialRepository.GetAllAsync();

        var allowedCategoryIds =
            await _categoryAccessService.GetAllowedCategoryIdsAsync(
                CategoryPermission.View);

        if (allowedCategoryIds is not null)
        {
            var visibleMaterialIds = materials
                .Where(material =>
                    allowedCategoryIds.Contains(material.CategoryId))
                .Select(material => material.Id)
                .ToHashSet();

            stocks = stocks
                .Where(stock => visibleMaterialIds.Contains(stock.MaterialId))
                .ToList();
        }

        return stocks
            .Select(stock => new StockResponse(
                stock.Id,
                stock.MaterialId,
                stock.Quantity,
                stock.UpdatedAtUtc))
            .ToList();
    }
}

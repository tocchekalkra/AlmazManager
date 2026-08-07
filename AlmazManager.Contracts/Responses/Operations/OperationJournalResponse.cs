namespace AlmazManager.Contracts.Responses.Operations;

public sealed record OperationJournalResponse(
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages,
    List<OperationJournalItemResponse> Items);

namespace AlmazManager.Contracts.Requests.Operations;

public sealed class OperationJournalRequest
{
    public Guid? MaterialId { get; init; }

    public Guid? DocumentId { get; init; }

    public Guid? UserId { get; init; }

    public string? Type { get; init; }

    public bool? IsReversal { get; init; }

    public string? Search { get; init; }

    public DateTime? DateFromUtc { get; init; }

    public DateTime? DateToUtc { get; init; }

    public string SortDirection { get; init; } =
        "desc";

    public int Page { get; init; } = 1;

    public int PageSize { get; init; } = 50;
}

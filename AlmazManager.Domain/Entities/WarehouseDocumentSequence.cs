using AlmazManager.Domain.Enums;

namespace AlmazManager.Domain.Entities;

public sealed class WarehouseDocumentSequence
{
    private WarehouseDocumentSequence()
    {
    }

    public WarehouseDocumentSequence(WarehouseDocumentType type)
    {
        Type = type;
    }

    public WarehouseDocumentType Type { get; private set; }

    public int LastNumber { get; private set; }

    public int TakeNext()
    {
        checked
        {
            LastNumber++;
        }

        return LastNumber;
    }
}

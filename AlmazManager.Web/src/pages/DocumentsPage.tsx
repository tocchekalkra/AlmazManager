import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    FileText,
    RefreshCcw,
    RotateCcw,
    Search,
    X,
} from 'lucide-react';

import api from '../api/api';
import { loadAllMaterialCatalogItems } from '../api/catalog';
import { useAuth } from '../auth/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { materialDisplayName } from '../utils/material';

type MaterialItem = {
    id: string;
    name: string;
    article: string;
    categoryName: string;
    unit: string;
    widthMeters?: number | null;
    kind?: string | null;
    colorCode?: string | null;
    colorName?: string | null;
    isActive: boolean;
};

type WarehouseDocumentItem = {
    id: string;
    materialId: string;
    quantity: number;
};

type WarehouseDocument = {
    id: string;
    number: string;
    type: 'Receiving' | 'Issue';
    status: string;
    userId: string;
    sequenceNumber?: number | null;
    documentDate: string;
    supplyInvoiceId?: string | null;
    supplier?: string | null;
    externalNumber?: string | null;
    recipient?: string | null;
    comment?: string | null;
    createdAtUtc: string;
    postedAtUtc?: string | null;
    cancelledAtUtc?: string | null;
    items: WarehouseDocumentItem[];
};

type InventoryDocumentItem = {
    id: string;
    materialId: string;
    materialName: string;
    article?: string | null;
    unit: string;
    expectedQuantity: number;
    actualQuantity: number;
    difference: number;
};

type InventoryDocument = {
    id: string;
    number: string;
    userId: string;
    comment?: string | null;
    status: string;
    createdAtUtc: string;
    postedAtUtc?: string | null;
    cancelledAtUtc?: string | null;
    totalItems: number;
    changedItems: number;
    items: InventoryDocumentItem[];
};

type UnifiedDocument =
    | { source: 'warehouse'; data: WarehouseDocument }
    | { source: 'inventory'; data: InventoryDocument };

const numberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
});

export default function DocumentsPage() {
    const { user } = useAuth();
    const isAdministrator = user?.role === 'Administrator';
    const [searchParams] = useSearchParams();
    const [canCancelDocuments, setCanCancelDocuments] = useState(isAdministrator);
    const [warehouseDocuments, setWarehouseDocuments] = useState<WarehouseDocument[]>([]);
    const [inventoryDocuments, setInventoryDocuments] = useState<InventoryDocument[]>([]);
    const [materials, setMaterials] = useState<MaterialItem[]>([]);
    const [selected, setSelected] = useState<UnifiedDocument | null>(null);
    const [typeFilter, setTypeFilter] = useState(searchParams.get('type') ?? 'all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [working, setWorking] = useState(false);
    const [error, setError] = useState('');

    const materialById = useMemo(
        () => new Map(materials.map((material) => [material.id, material])),
        [materials],
    );

    const documents = useMemo<UnifiedDocument[]>(() => [
        ...warehouseDocuments.map((data): UnifiedDocument => ({ source: 'warehouse', data })),
        ...inventoryDocuments.map((data): UnifiedDocument => ({ source: 'inventory', data })),
    ].sort((a, b) =>
        new Date(b.data.createdAtUtc).getTime() - new Date(a.data.createdAtUtc).getTime(),
    ), [warehouseDocuments, inventoryDocuments]);

    const filteredDocuments = useMemo(() => {
        const normalized = search.trim().toLowerCase();

        return documents.filter((document) => {
            const type = getDocumentType(document);
            const typeMatches = typeFilter === 'all' || type === typeFilter;
            const statusMatches = statusFilter === 'all' || document.data.status === statusFilter;

            const searchable = [
                document.data.number,
                document.data.comment,
                document.source === 'warehouse' ? document.data.supplier : null,
                document.source === 'warehouse' ? document.data.externalNumber : null,
                document.source === 'warehouse' ? document.data.recipient : null,
                document.source === 'warehouse' ? document.data.documentDate : null,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return typeMatches && statusMatches && (!normalized || searchable.includes(normalized));
        });
    }, [documents, search, statusFilter, typeFilter]);

    useEffect(() => {
        void loadData();
        api.get<{ canCancelDocuments: boolean }>('/users/me/access')
            .then((response) => setCanCancelDocuments(response.data.canCancelDocuments))
            .catch(() => setCanCancelDocuments(isAdministrator));
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const [warehouseResponse, inventoryResponse, materialItems] = await Promise.all([
                api.get<WarehouseDocument[]>('/documents'),
                api.get<InventoryDocument[]>('/inventory-documents'),
                loadAllMaterialCatalogItems<MaterialItem>(),
            ]);

            setWarehouseDocuments(warehouseResponse.data ?? []);
            setInventoryDocuments(inventoryResponse.data ?? []);
            setMaterials(materialItems);

            const requestedDocumentId = searchParams.get('document');
            if (requestedDocumentId) {
                const requested = [
                    ...warehouseResponse.data.map((data): UnifiedDocument => ({ source: 'warehouse', data })),
                    ...inventoryResponse.data.map((data): UnifiedDocument => ({ source: 'inventory', data })),
                ].find((item) => item.data.id === requestedDocumentId);
                if (requested) setSelected(requested);
            }

            if (selected) {
                const refreshed = [
                    ...warehouseResponse.data.map((data): UnifiedDocument => ({ source: 'warehouse', data })),
                    ...inventoryResponse.data.map((data): UnifiedDocument => ({ source: 'inventory', data })),
                ].find((item) => item.data.id === selected.data.id);

                setSelected(refreshed ?? null);
            }
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось загрузить документы.',
            );
        } finally {
            setLoading(false);
        }
    }

    async function cancelDocument(document: UnifiedDocument) {
        if (!canCancelDocuments || document.data.status !== 'Posted') {
            return;
        }

        if (!window.confirm(`Отменить проведённый документ ${document.data.number}?`)) {
            return;
        }

        try {
            setWorking(true);
            setError('');

            const endpoint = document.source === 'warehouse'
                ? `/documents/${document.data.id}/cancel`
                : `/inventory-documents/${document.data.id}/cancel`;

            await api.post(endpoint);
            await loadData();
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось отменить документ.',
            );
        } finally {
            setWorking(false);
        }
    }

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">DOCUMENTS</p>
                    <h1>Документы</h1>
                    <p>Приход, расход и инвентаризация в едином журнале.</p>
                </div>

                <button
                    type="button"
                    className="button secondary"
                    onClick={() => void loadData()}
                >
                    <RefreshCcw size={17} />
                    Обновить
                </button>
            </div>

            <section className="panel" style={styles.filters}>
                <label style={styles.searchBox}>
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Номер, поставщик, накладная..."
                        style={styles.searchInput}
                    />
                </label>

                <select
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value)}
                    style={styles.control}
                >
                    <option value="all">Все типы</option>
                    <option value="Receiving">Приход</option>
                    <option value="Issue">Расход</option>
                    <option value="Inventory">Инвентаризация</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    style={styles.control}
                >
                    <option value="all">Все статусы</option>
                    <option value="Draft">Черновики</option>
                    <option value="Posted">Проведённые</option>
                    <option value="Cancelled">Отменённые</option>
                </select>
            </section>

            {error && <div style={styles.error}>{error}</div>}

            <section className="panel" style={{ marginTop: 15 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Номер</th>
                                <th>Тип</th>
                                <th>Дата</th>
                                <th>Поставщик / накладная</th>
                                <th>Позиций</th>
                                <th>Статус</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && filteredDocuments.map((document) => (
                                <tr
                                    key={`${document.source}-${document.data.id}`}
                                    style={styles.clickableRow}
                                    onClick={() => setSelected(document)}
                                >
                                    <td><strong>{document.data.number}</strong></td>
                                    <td>{documentTypeLabel(getDocumentType(document))}</td>
                                    <td>{document.source === 'warehouse' ? new Date(`${document.data.documentDate}T00:00:00`).toLocaleDateString('ru-RU') : new Date(document.data.createdAtUtc).toLocaleString('ru-RU')}</td>
                                    <td>
                                        {document.source === 'warehouse'
                                            ? [document.data.type === 'Issue' ? document.data.recipient : document.data.supplier, document.data.externalNumber]
                                                .filter(Boolean)
                                                .join(' · ') || '—'
                                            : '—'}
                                    </td>
                                    <td>{document.data.items.length}</td>
                                    <td>
                                        <span style={statusStyle(document.data.status)}>
                                            {statusLabel(document.data.status)}
                                        </span>
                                    </td>
                                    <td><FileText size={16} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {loading && <div style={styles.empty}>Загрузка документов...</div>}
                {!loading && filteredDocuments.length === 0 && (
                    <div style={styles.empty}>Документы не найдены.</div>
                )}
            </section>

            {selected && (
                <div style={styles.overlay} onMouseDown={() => setSelected(null)}>
                    <div style={styles.modal} onMouseDown={(event) => event.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <div>
                                <p className="eyebrow">{documentTypeLabel(getDocumentType(selected))}</p>
                                <h2 style={{ margin: 0 }}>{selected.data.number}</h2>
                            </div>
                            <button type="button" style={styles.iconButton} onClick={() => setSelected(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={styles.metaGrid}>
                            <Meta label="Статус" value={statusLabel(selected.data.status)} />
                            <Meta label="Создан" value={new Date(selected.data.createdAtUtc).toLocaleString('ru-RU')} />
                            <Meta label="Проведён" value={selected.data.postedAtUtc ? new Date(selected.data.postedAtUtc).toLocaleString('ru-RU') : '—'} />
                            <Meta label="Комментарий" value={selected.data.comment || '—'} />
                            {selected.source === 'warehouse' && (
                                <>
                                    <Meta label="Поставщик" value={selected.data.supplier || '—'} />
                                    <Meta label="Накладная" value={selected.data.externalNumber || '—'} />
                                </>
                            )}
                        </div>

                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Материал</th>
                                        {selected.source === 'inventory' && <th>По системе</th>}
                                        {selected.source === 'inventory' && <th>Факт</th>}
                                        {selected.source === 'inventory' && <th>Разница</th>}
                                        {selected.source === 'warehouse' && <th>Количество</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {selected.source === 'warehouse'
                                        ? selected.data.items.map((item) => {
                                            const material = materialById.get(item.materialId);
                                            return (
                                                <tr key={item.id}>
                                                    <td>
                                                        <strong>{material ? materialDisplayName(material) : 'Архивный материал'}</strong>
                                                        <div style={styles.subtle}>{material?.article ?? item.materialId}</div>
                                                    </td>
                                                    <td>
                                                        {numberFormatter.format(item.quantity)}{' '}
                                                        {unitLabel(material?.unit ?? '')}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                        : selected.data.items.map((item) => {
                                            const material = materialById.get(item.materialId);
                                            return <tr key={item.id}>
                                                <td>
                                                    <strong>{materialDisplayName({
                                                        materialName: item.materialName,
                                                        categoryName: material?.categoryName,
                                                        widthMeters: material?.widthMeters,
                                                        kind: material?.kind,
                                                        colorCode: material?.colorCode,
                                                        colorName: material?.colorName,
                                                    })}</strong>
                                                    <div style={styles.subtle}>{item.article ?? '—'}</div>
                                                </td>
                                                <td>{numberFormatter.format(item.expectedQuantity)} {unitLabel(item.unit)}</td>
                                                <td>{numberFormatter.format(item.actualQuantity)} {unitLabel(item.unit)}</td>
                                                <td style={
                                                    item.difference < 0
                                                        ? styles.negative
                                                        : item.difference > 0
                                                            ? styles.positive
                                                            : undefined
                                                }>
                                                    {item.difference > 0 ? '+' : ''}{numberFormatter.format(item.difference)}
                                                </td>
                                            </tr>;
                                        })}
                                </tbody>
                            </table>
                        </div>

                        {canCancelDocuments && selected.data.status === 'Posted' && (
                            <div style={styles.modalActions}>
                                <button
                                    type="button"
                                    className="button secondary"
                                    disabled={working}
                                    onClick={() => void cancelDocument(selected)}
                                >
                                    <RotateCcw size={16} />
                                    {working ? 'Отмена...' : 'Отменить документ'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={styles.metaLabel}>{label}</div>
            <div style={styles.metaValue}>{value}</div>
        </div>
    );
}

function getDocumentType(document: UnifiedDocument) {
    return document.source === 'inventory' ? 'Inventory' : document.data.type;
}

function documentTypeLabel(type: string) {
    return type === 'Receiving' ? 'Приход' : type === 'Issue' ? 'Расход' : 'Инвентаризация';
}

function statusLabel(status: string) {
    return status === 'Draft' ? 'Черновик' : status === 'Posted' ? 'Проведён' : status === 'Cancelled' ? 'Отменён' : status;
}

function statusStyle(status: string): CSSProperties {
    if (status === 'Posted') return styles.statusPosted;
    if (status === 'Cancelled') return styles.statusCancelled;
    return styles.statusDraft;
}

function unitLabel(unit: string) {
    const labels: Record<string, string> = {
        Piece: 'шт.', Meter: 'м', SquareMeter: 'м²', Kilogram: 'кг',
        Liter: 'л', Roll: 'рул.', Sheet: 'лист',
    };
    return labels[unit] ?? unit;
}

const styles: Record<string, CSSProperties> = {
    filters: { display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: 10 },
    searchBox: {
        display: 'flex', alignItems: 'center', gap: 9,
        border: '1px solid #273040', borderRadius: 10,
        padding: '0 11px', minHeight: 42, color: '#748094',
    },
    searchInput: { width: '100%', border: 0, outline: 0, background: 'transparent', color: '#f2f4f8', font: 'inherit' },
    control: { minHeight: 42, border: '1px solid #273040', borderRadius: 10, background: '#111722', color: '#dce2eb', padding: '0 10px' },
    error: { marginTop: 15, border: '1px solid rgba(244,91,105,.35)', background: 'rgba(244,91,105,.08)', color: '#ff9ca5', borderRadius: 12, padding: '12px 14px' },
    clickableRow: { cursor: 'pointer' },
    empty: { padding: 28, textAlign: 'center', color: '#768295' },
    statusPosted: { color: '#54d99c', fontWeight: 700, fontSize: 13 },
    statusCancelled: { color: '#ff8b94', fontWeight: 700, fontSize: 13 },
    statusDraft: { color: '#ffb454', fontWeight: 700, fontSize: 13 },
    overlay: { position: 'fixed', inset: 0, background: 'rgba(3,7,12,.78)', backdropFilter: 'blur(6px)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 24 },
    modal: { width: 'min(980px, 96vw)', maxHeight: '90vh', overflow: 'auto', background: '#111722', border: '1px solid #293345', borderRadius: 18, boxShadow: '0 24px 80px rgba(0,0,0,.45)', padding: 22 },
    modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    iconButton: { border: 0, background: 'transparent', color: '#98a3b5', cursor: 'pointer', padding: 6 },
    metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 14, marginBottom: 22 },
    metaLabel: { color: '#758195', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 },
    metaValue: { color: '#e7ebf2', fontSize: 14 },
    subtle: { color: '#768295', fontSize: 12, marginTop: 3 },
    positive: { color: '#54d99c', fontWeight: 700 },
    negative: { color: '#ff7f8b', fontWeight: 700 },
    modalActions: { display: 'flex', justifyContent: 'flex-end', paddingTop: 18 },
};

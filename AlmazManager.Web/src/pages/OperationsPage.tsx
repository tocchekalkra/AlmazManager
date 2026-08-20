import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    ChevronLeft,
    ChevronRight,
    History,
    RefreshCcw,
    Search,
} from 'lucide-react';

import api from '../api/api';
import { loadAllMaterialCatalogItems } from '../api/catalog';
import { materialDisplayName } from '../utils/material';

type OperationItem = {
    id: string;
    materialId: string;
    materialName: string;
    materialArticle: string;
    type: string;
    displayType: string;
    quantity: number;
    quantityBefore: number;
    quantityChange: number;
    quantityAfter: number;
    userId: string;
    userName: string;
    documentId?: string | null;
    documentNumber?: string | null;
    isReversal: boolean;
    reversedOperationId?: string | null;
    createdAtUtc: string;
    comment?: string | null;
};

type OperationJournalResponse = {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: OperationItem[];
};

type MaterialLookup = {
    id: string;
    categoryId: string;
    categoryName: string;
    unit: string;
    widthMeters?: number | null;
};

type Category = {
    id: string;
    name: string;
    isActive: boolean;
};

const numberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
});

export default function OperationsPage() {
    const [journal, setJournal] = useState<OperationJournalResponse | null>(null);
    const [materials, setMaterials] = useState<MaterialLookup[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [type, setType] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const materialById = useMemo(
        () => new Map(materials.map((material) => [material.id, material])),
        [materials],
    );

    useEffect(() => {
        void loadLookups();
    }, []);

    useEffect(() => {
        void loadJournal();
    }, [page, search, type, categoryId, dateFrom, dateTo]);

    async function loadLookups() {
        try {
            const [materialItems, categoryResponse] = await Promise.all([
                loadAllMaterialCatalogItems<MaterialLookup>(),
                api.get<Category[]>('/categories'),
            ]);

            setMaterials(materialItems);
            setCategories(categoryResponse.data ?? []);
        } catch (requestError) {
            console.error('Не удалось загрузить справочники журнала:', requestError);
        }
    }

    async function loadJournal() {
        try {
            setLoading(true);
            setError('');

            const response = await api.get<OperationJournalResponse>(
                '/operations/journal',
                {
                    params: {
                        page,
                        pageSize: 50,
                        search: search.trim() || undefined,
                        type: type || undefined,
                        categoryId: categoryId || undefined,
                        dateFromUtc: dateFrom
                            ? new Date(`${dateFrom}T00:00:00`).toISOString()
                            : undefined,
                        dateToUtc: dateTo
                            ? new Date(`${dateTo}T23:59:59.999`).toISOString()
                            : undefined,
                    },
                },
            );

            setJournal(response.data);
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось загрузить журнал операций.',
            );
        } finally {
            setLoading(false);
        }
    }

    function changeFilter(action: () => void) {
        action();
        setPage(1);
    }

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">AUDIT</p>
                    <h1>Журнал операций</h1>
                    <p>Полная история каждого изменения складских остатков.</p>
                </div>

                <button
                    type="button"
                    className="button secondary"
                    onClick={() => void loadJournal()}
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
                        onChange={(event) => changeFilter(() => setSearch(event.target.value))}
                        placeholder="Материал, документ, сотрудник..."
                        style={styles.searchInput}
                    />
                </label>

                <select
                    value={type}
                    onChange={(event) => changeFilter(() => setType(event.target.value))}
                    style={styles.control}
                >
                    <option value="">Все операции</option>
                    <option value="Receiving">Приход</option>
                    <option value="Issue">Расход</option>
                    <option value="Inventory">Инвентаризация</option>
                    <option value="Return">Возврат</option>
                    <option value="WriteOff">Списание</option>
                </select>

                <select
                    value={categoryId}
                    onChange={(event) => changeFilter(() => setCategoryId(event.target.value))}
                    style={styles.control}
                >
                    <option value="">Все категории</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={dateFrom}
                    onChange={(event) => changeFilter(() => setDateFrom(event.target.value))}
                    style={styles.control}
                    aria-label="Дата с"
                />

                <input
                    type="date"
                    value={dateTo}
                    onChange={(event) => changeFilter(() => setDateTo(event.target.value))}
                    style={styles.control}
                    aria-label="Дата по"
                />
            </section>

            {error && <div style={styles.error}>{error}</div>}

            <section className="panel" style={{ marginTop: 15 }}>
                <div style={styles.summary}>
                    <div style={styles.summaryIcon}><History size={18} /></div>
                    <strong>{journal?.totalCount ?? 0}</strong>
                    <span>операций найдено</span>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Материал</th>
                                <th>Ширина</th>
                                <th>Операция</th>
                                <th>Было</th>
                                <th>Изменение</th>
                                <th>Стало</th>
                                <th>Пользователь</th>
                                <th>Документ</th>
                                <th>Комментарий</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && journal?.items.map((item) => {
                                const material = materialById.get(item.materialId);
                                const unit = unitLabel(material?.unit ?? '');

                                return (
                                    <tr key={item.id}>
                                        <td>{new Date(item.createdAtUtc).toLocaleString('ru-RU')}</td>
                                        <td>
                                            <strong>{materialDisplayName({
                                                materialName: item.materialName,
                                                categoryName: material?.categoryName,
                                                widthMeters: material?.widthMeters,
                                            })}</strong>
                                            <div style={styles.subtle}>{item.materialArticle}</div>
                                        </td>
                                        <td>
                                            {material?.widthMeters
                                                ? `${numberFormatter.format(material.widthMeters)} м`
                                                : '—'}
                                        </td>
                                        <td>
                                            <span style={operationStyle(item)}>
                                                {item.displayType}
                                            </span>
                                        </td>
                                        <td>{numberFormatter.format(item.quantityBefore)} {unit}</td>
                                        <td style={
                                            item.quantityChange < 0
                                                ? styles.negative
                                                : styles.positive
                                        }>
                                            {item.quantityChange > 0 ? '+' : ''}
                                            {numberFormatter.format(item.quantityChange)} {unit}
                                        </td>
                                        <td>{numberFormatter.format(item.quantityAfter)} {unit}</td>
                                        <td>{item.userName}</td>
                                        <td>{item.documentNumber ?? '—'}</td>
                                        <td style={styles.comment}>{item.comment ?? '—'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {loading && <div style={styles.empty}>Загрузка журнала...</div>}
                {!loading && journal?.items.length === 0 && (
                    <div style={styles.empty}>Операции не найдены.</div>
                )}

                <div style={styles.pagination}>
                    <span>
                        Страница {journal?.page ?? page} из {Math.max(journal?.totalPages ?? 0, 1)}
                    </span>
                    <div style={styles.pageButtons}>
                        <button
                            type="button"
                            className="button secondary"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            type="button"
                            className="button secondary"
                            disabled={
                                loading ||
                                !journal ||
                                journal.totalPages === 0 ||
                                page >= journal.totalPages
                            }
                            onClick={() => setPage((value) => value + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function operationStyle(item: OperationItem): CSSProperties {
    if (item.isReversal) {
        return styles.reversal;
    }

    if (item.type === 'Receiving') {
        return styles.receiving;
    }

    if (item.type === 'Issue') {
        return styles.issue;
    }

    return styles.inventory;
}

function unitLabel(unit: string) {
    const labels: Record<string, string> = {
        Piece: 'шт.', Meter: 'м', SquareMeter: 'м²', Kilogram: 'кг',
        Liter: 'л', Roll: 'рул.', Sheet: 'лист',
    };
    return labels[unit] ?? unit;
}

const styles: Record<string, CSSProperties> = {
    filters: {
        display: 'grid',
        gridTemplateColumns: 'minmax(260px, 1fr) 180px 200px 150px 150px',
        gap: 10,
        alignItems: 'center',
    },
    searchBox: {
        display: 'flex', alignItems: 'center', gap: 9,
        border: '1px solid #273040', borderRadius: 10,
        padding: '0 11px', minHeight: 42, color: '#748094',
    },
    searchInput: {
        width: '100%', border: 0, outline: 0, background: 'transparent',
        color: '#f2f4f8', font: 'inherit',
    },
    control: {
        minHeight: 42, border: '1px solid #273040', borderRadius: 10,
        background: '#111722', color: '#dce2eb', padding: '0 10px',
    },
    summary: {
        display: 'flex', alignItems: 'center', gap: 8,
        paddingBottom: 14, color: '#8590a2', fontSize: 13,
    },
    summaryIcon: { color: '#4aa6ff', display: 'flex' },
    subtle: { color: '#768295', fontSize: 12, marginTop: 3 },
    comment: { maxWidth: 280, whiteSpace: 'normal', color: '#aab3c2' },
    positive: { color: '#54d99c', fontWeight: 700 },
    negative: { color: '#ff7f8b', fontWeight: 700 },
    receiving: { color: '#54d99c', fontWeight: 700, fontSize: 13 },
    issue: { color: '#ff8b94', fontWeight: 700, fontSize: 13 },
    inventory: { color: '#6fb7ff', fontWeight: 700, fontSize: 13 },
    reversal: { color: '#ffb454', fontWeight: 700, fontSize: 13 },
    error: {
        marginTop: 15, border: '1px solid rgba(244,91,105,.35)',
        background: 'rgba(244,91,105,.08)', color: '#ff9ca5',
        borderRadius: 12, padding: '12px 14px',
    },
    empty: { padding: 28, textAlign: 'center', color: '#768295' },
    pagination: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        paddingTop: 16, color: '#8590a2', fontSize: 13,
    },
    pageButtons: { display: 'flex', gap: 8 },
};

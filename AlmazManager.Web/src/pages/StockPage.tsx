import {
    useEffect,
    useState,
    type CSSProperties,
} from 'react';

import {
    AlertTriangle,
    Boxes,
    ChevronLeft,
    ChevronRight,
    RefreshCcw,
    Search,
} from 'lucide-react';

import api from '../api/api';

type StockItem = {
    materialId: string;
    materialName: string;
    article: string;
    categoryId: string;
    unit: string;
    currentQuantity: number;
    minimumQuantity: number;
    differenceFromMinimum: number;
    belowMinimum: boolean;
    hasStock: boolean;
    isActive: boolean;
    updatedAtUtc?: string | null;
};

type StockCatalogResponse = {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    totalQuantity: number;
    belowMinimumCount: number;
    withoutStockCount: number;
    items: StockItem[];
};

const formatNumber = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
});

export default function StockPage() {
    const [data, setData] = useState<StockCatalogResponse | null>(null);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [onlyLow, setOnlyLow] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        void loadStock();
    }, [page, search, onlyLow]);

    async function loadStock() {
        try {
            setLoading(true);
            setError('');

            const response = await api.get<StockCatalogResponse>(
                '/stocks/catalog',
                {
                    params: {
                        page,
                        pageSize: 50,
                        search: search.trim() || undefined,
                        belowMinimum: onlyLow ? true : undefined,
                        sortBy: 'name',
                    },
                },
            );

            setData(response.data);
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось загрузить остатки склада.',
            );
        } finally {
            setLoading(false);
        }
    }

    function updateSearch(value: string) {
        setSearch(value);
        setPage(1);
    }

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">WAREHOUSE</p>
                    <h1>Склад</h1>
                    <p>Актуальные остатки доступных вам материалов.</p>
                </div>

                <button
                    type="button"
                    className="button secondary"
                    onClick={() => void loadStock()}
                >
                    <RefreshCcw size={17} />
                    Обновить
                </button>
            </div>

            <section style={styles.stats}>
                <Stat
                    label="Позиций"
                    value={data?.totalCount ?? 0}
                    icon={<Boxes size={19} />}
                />
                <Stat
                    label="Ниже минимума"
                    value={data?.belowMinimumCount ?? 0}
                    icon={<AlertTriangle size={19} />}
                    warning
                />
                <Stat
                    label="Без остатка"
                    value={data?.withoutStockCount ?? 0}
                    icon={<Boxes size={19} />}
                />
            </section>

            <section className="panel" style={styles.toolbar}>
                <label style={styles.searchBox}>
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(event) => updateSearch(event.target.value)}
                        placeholder="Материал или артикул..."
                        style={styles.searchInput}
                    />
                </label>

                <label style={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={onlyLow}
                        onChange={(event) => {
                            setOnlyLow(event.target.checked);
                            setPage(1);
                        }}
                    />
                    Только ниже минимума
                </label>
            </section>

            {error && <div style={styles.error}>{error}</div>}

            <section className="panel" style={{ marginTop: 15 }}>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Материал</th>
                                <th>Артикул</th>
                                <th>Остаток</th>
                                <th>Минимум</th>
                                <th>Статус</th>
                                <th>Обновлено</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && data?.items.map((item) => (
                                <tr key={item.materialId}>
                                    <td>
                                        <strong>{item.materialName}</strong>
                                        {!item.isActive && (
                                            <span style={styles.archive}>архив</span>
                                        )}
                                    </td>
                                    <td>{item.article}</td>
                                    <td>
                                        <strong>
                                            {formatNumber.format(item.currentQuantity)}{' '}
                                            {unitLabel(item.unit)}
                                        </strong>
                                    </td>
                                    <td>
                                        {formatNumber.format(item.minimumQuantity)}{' '}
                                        {unitLabel(item.unit)}
                                    </td>
                                    <td>
                                        <span style={
                                            item.belowMinimum
                                                ? styles.statusWarning
                                                : styles.statusOk
                                        }>
                                            {item.belowMinimum
                                                ? item.currentQuantity <= 0
                                                    ? 'Нет на складе'
                                                    : 'Ниже минимума'
                                                : 'В норме'}
                                        </span>
                                    </td>
                                    <td>
                                        {item.updatedAtUtc
                                            ? new Date(item.updatedAtUtc).toLocaleString('ru-RU')
                                            : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {loading && <div style={styles.empty}>Загрузка...</div>}
                {!loading && data?.items.length === 0 && (
                    <div style={styles.empty}>Материалы не найдены.</div>
                )}

                <div style={styles.pagination}>
                    <span>
                        Страница {data?.page ?? page} из {Math.max(data?.totalPages ?? 0, 1)}
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
                                !data ||
                                data.totalPages === 0 ||
                                page >= data.totalPages
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

function Stat({
    label,
    value,
    icon,
    warning = false,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    warning?: boolean;
}) {
    return (
        <article className="stat-card">
            <div className="stat-icon" style={warning ? styles.warningIcon : undefined}>
                {icon}
            </div>
            <div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
            </div>
        </article>
    );
}

function unitLabel(unit: string) {
    const labels: Record<string, string> = {
        Piece: 'шт.',
        Meter: 'м',
        SquareMeter: 'м²',
        Kilogram: 'кг',
        Liter: 'л',
        Roll: 'рул.',
        Sheet: 'лист',
    };

    return labels[unit] ?? unit;
}

const styles: Record<string, CSSProperties> = {
    stats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 14,
        marginBottom: 15,
    },
    toolbar: {
        display: 'flex',
        gap: 14,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    searchBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        minWidth: 320,
        color: '#7f8a9b',
    },
    searchInput: {
        width: '100%',
        border: 0,
        outline: 0,
        background: 'transparent',
        color: '#f5f7fb',
        font: 'inherit',
    },
    checkbox: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        color: '#b8c0ce',
        fontSize: 14,
    },
    error: {
        marginTop: 15,
        border: '1px solid rgba(244, 91, 105, .35)',
        background: 'rgba(244, 91, 105, .08)',
        color: '#ff9ca5',
        borderRadius: 12,
        padding: '12px 14px',
    },
    archive: {
        marginLeft: 8,
        color: '#7f8a9b',
        fontSize: 11,
        textTransform: 'uppercase',
    },
    statusOk: {
        color: '#54d99c',
        fontWeight: 700,
        fontSize: 13,
    },
    statusWarning: {
        color: '#ffb454',
        fontWeight: 700,
        fontSize: 13,
    },
    warningIcon: {
        color: '#ffb454',
    },
    empty: {
        padding: 28,
        textAlign: 'center',
        color: '#7f8a9b',
    },
    pagination: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 16,
        color: '#8f99a9',
        fontSize: 13,
    },
    pageButtons: {
        display: 'flex',
        gap: 8,
    },
};

import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    AlertTriangle,
    Boxes,
    Check,
    FileSpreadsheet,
    FileText,
    GripVertical,
    Lock,
    RefreshCcw,
    Search,
    Unlock,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { ReactNode } from 'react';

import api from '../api/api';
import { materialDisplayName } from '../utils/material';
import {
    exportStockExcel,
    printStockPdf,
    type ExportStockItem,
} from '../utils/stockExport';

type StockItem = ExportStockItem & {
    differenceFromMinimum: number;
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

type MaterialGroup = {
    key: string;
    name: string;
    items: StockItem[];
};

type CategoryGroup = {
    id: string;
    name: string;
    materials: MaterialGroup[];
};

const formatNumber = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 3,
});

export default function StockPage() {
    const [searchParams] = useSearchParams();
    const targetMaterialId = searchParams.get('material');
    const [data, setData] = useState<StockCatalogResponse | null>(null);
    const [exportItems, setExportItems] = useState<StockItem[]>([]);
    const [search, setSearch] = useState('');
    const [onlyLow, setOnlyLow] = useState(searchParams.get('belowMinimum') === 'true');
    const [orderMode, setOrderMode] = useState(false);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [savingOrder, setSavingOrder] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        void loadStock();
    }, [search, onlyLow]);

    useEffect(() => {
        void loadExportStock();
    }, []);

    async function loadStock() {
        try {
            setLoading(true);
            setError('');

            const response = await api.get<StockCatalogResponse>(
                '/stocks/catalog',
                {
                    params: {
                        page: 1,
                        pageSize: 2000,
                        search: search.trim() || undefined,
                        belowMinimum: onlyLow ? true : undefined,
                    },
                },
            );

            const target = response.data.items.find(
                (item) => item.materialId === targetMaterialId,
            );
            setData(target
                ? {
                    ...response.data,
                    items: [
                        target,
                        ...response.data.items.filter(
                            (item) => item.materialId !== targetMaterialId,
                        ),
                    ],
                }
                : response.data);
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось загрузить остатки склада.',
            );
        } finally {
            setLoading(false);
        }
    }

    async function loadExportStock() {
        try {
            const response = await api.get<StockCatalogResponse>(
                '/stocks/catalog',
                { params: { page: 1, pageSize: 2000 } },
            );
            setExportItems(response.data.items);
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось подготовить полный склад для экспорта.',
            );
        }
    }

    const standardCategories = useMemo(
        () => buildCategoryGroups(
            data?.items.filter((item) => item.kind !== 'Oracal641') ?? [],
        ),
        [data],
    );
    const oracalItems = useMemo(
        () => (data?.items.filter((item) => item.kind === 'Oracal641') ?? [])
            .slice()
            .sort((a, b) => {
                const colorOrder = (a.colorCode ?? '').localeCompare(
                    b.colorCode ?? '',
                    'ru',
                    { numeric: true },
                );

                return colorOrder || Number(b.widthMeters ?? 0) - Number(a.widthMeters ?? 0);
            }),
        [data],
    );

    async function reorder(targetId: string) {
        if (
            !orderMode ||
            !draggedId ||
            draggedId === targetId ||
            search ||
            onlyLow ||
            !data
        ) return;

        const items = [...data.items];
        const from = items.findIndex((item) => item.materialId === draggedId);
        const to = items.findIndex((item) => item.materialId === targetId);
        if (from < 0 || to < 0) return;

        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        setData({ ...data, items });
        setDraggedId(null);

        try {
            setSavingOrder(true);
            setError('');
            await api.put('/preferences', {
                materialOrder: items.map((item) => item.materialId),
            });
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось сохранить персональный порядок.',
            );
            await loadStock();
        } finally {
            setSavingOrder(false);
        }
    }

    async function reorderCategory(targetId: string) {
        if (
            !orderMode ||
            !draggedCategoryId ||
            draggedCategoryId === targetId ||
            search ||
            onlyLow ||
            !data
        ) return;

        const categoryIds = standardCategories.map((category) => category.id);
        const from = categoryIds.indexOf(draggedCategoryId);
        const to = categoryIds.indexOf(targetId);
        if (from < 0 || to < 0) return;

        const [moved] = categoryIds.splice(from, 1);
        categoryIds.splice(to, 0, moved);

        const orderByCategory = new Map(
            categoryIds.map((categoryId, index) => [categoryId, index]),
        );
        const standardItems = data.items
            .map((item, index) => ({ item, index }))
            .filter(({ item }) => item.kind !== 'Oracal641')
            .sort((a, b) =>
                (orderByCategory.get(a.item.categoryId) ?? Number.MAX_SAFE_INTEGER) -
                (orderByCategory.get(b.item.categoryId) ?? Number.MAX_SAFE_INTEGER) ||
                a.index - b.index,
            )
            .map(({ item }) => item);
        const oracal = data.items.filter((item) => item.kind === 'Oracal641');

        setData({ ...data, items: [...standardItems, ...oracal] });
        setDraggedCategoryId(null);

        const allCategoryIds = [...new Set(data.items.map((item) => item.categoryId))];
        const standardCategorySet = new Set(categoryIds);
        let standardIndex = 0;
        const preferenceOrder = allCategoryIds.map((categoryId) =>
            standardCategorySet.has(categoryId)
                ? categoryIds[standardIndex++]
                : categoryId,
        );

        try {
            setSavingOrder(true);
            setError('');
            await api.put('/preferences', { categoryOrder: preferenceOrder });
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось сохранить порядок категорий.',
            );
            await loadStock();
        } finally {
            setSavingOrder(false);
        }
    }

    function runPdfExport(kind: 'standard' | 'oracal') {
        try {
            if (exportItems.length === 0) return;
            setError('');
            printStockPdf(exportItems, kind);
        } catch (exportError: any) {
            setError(exportError?.message ?? 'Не удалось открыть отчёт для PDF.');
        }
    }

    const reorderingAvailable = !search && !onlyLow && !loading;

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">WAREHOUSE</p>
                    <h1>Склад</h1>
                    <p>Материалы сгруппированы по категориям, названиям и ширинам.</p>
                </div>

                <div className="heading-actions">
                    <button
                        type="button"
                        className={orderMode ? 'button primary' : 'button secondary'}
                        disabled={!reorderingAvailable || savingOrder}
                        onClick={() => {
                            setOrderMode((value) => !value);
                            setDraggedId(null);
                            setDraggedCategoryId(null);
                        }}
                    >
                        {orderMode ? <Check size={17} /> : <Unlock size={17} />}
                        {savingOrder
                            ? 'Сохранение...'
                            : orderMode
                                ? 'Завершить порядок'
                                : 'Изменить порядок'}
                    </button>
                    <button
                        type="button"
                        className="button secondary"
                        onClick={() => {
                            void loadStock();
                            void loadExportStock();
                        }}
                    >
                        <RefreshCcw size={17} />
                        Обновить
                    </button>
                </div>
            </div>

            <section style={styles.stats}>
                <Stat label="Позиций" value={data?.totalCount ?? 0} icon={<Boxes size={19} />} />
                <Stat label="Ниже минимума" value={data?.belowMinimumCount ?? 0} icon={<AlertTriangle size={19} />} warning />
                <Stat label="Без остатка" value={data?.withoutStockCount ?? 0} icon={<Boxes size={19} />} />
            </section>

            <section className="panel" style={styles.toolbar}>
                <label style={styles.searchBox}>
                    <Search size={17} />
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setOrderMode(false);
                            setDraggedCategoryId(null);
                        }}
                        placeholder="Материал, ширина или артикул..."
                        style={styles.searchInput}
                    />
                </label>

                <label style={styles.checkbox}>
                    <input
                        type="checkbox"
                        checked={onlyLow}
                        onChange={(event) => {
                            setOnlyLow(event.target.checked);
                            setOrderMode(false);
                            setDraggedCategoryId(null);
                        }}
                    />
                    Только ниже минимума
                </label>
            </section>

            {orderMode && (
                <div style={styles.orderHint}>
                    <Unlock size={16} />
                    Режим перемещения включён. Перетаскивайте категории за заголовок, а материалы — за строки; порядок сохраняется лично для вас.
                </div>
            )}
            {!orderMode && (
                <div style={styles.lockHint}>
                    <Lock size={15} />
                    Перемещение заблокировано от случайных действий.
                </div>
            )}
            {error && <div style={styles.error}>{error}</div>}

            <StockSection
                title="Обычные материалы"
                subtitle="Баннеры, четыре категории плёнок и остальные материалы"
                actions={(
                    <>
                        <button className="button secondary" type="button" disabled={exportItems.length === 0} onClick={() => exportStockExcel(exportItems, 'standard')}>
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button className="button secondary" type="button" disabled={exportItems.length === 0} onClick={() => runPdfExport('standard')}>
                            <FileText size={16} /> PDF
                        </button>
                    </>
                )}
            >
                {loading && <div style={styles.empty}>Загрузка...</div>}
                {!loading && standardCategories.map((category) => (
                    <section key={category.id} style={styles.categoryCard}>
                        <div
                            style={{
                                ...styles.categoryHeader,
                                ...(orderMode ? styles.draggableCategoryHeader : {}),
                            }}
                            draggable={orderMode}
                            onDragStart={() => {
                                setDraggedCategoryId(category.id);
                                setDraggedId(null);
                            }}
                            onDragOver={(event) => orderMode && event.preventDefault()}
                            onDrop={() => void reorderCategory(category.id)}
                        >
                            <div style={styles.categoryTitleWrap}>
                                {orderMode ? <GripVertical size={19} /> : <Lock size={15} />}
                                <div>
                                <p className="eyebrow">КАТЕГОРИЯ</p>
                                <h3>{category.name}</h3>
                                </div>
                            </div>
                            <span>{category.materials.reduce((sum, group) => sum + group.items.length, 0)} поз.</span>
                        </div>

                        {category.materials.map((group) => (
                            <div key={group.key} style={styles.materialGroup}>
                                <div style={styles.materialGroupTitle}>
                                    <strong>{group.name}</strong>
                                    <span>{group.items.length} ширин</span>
                                </div>
                                <div className="table-wrapper">
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th aria-label="Порядок" />
                                                <th>Материал - ширина</th>
                                                <th>Артикул</th>
                                                <th>Остаток</th>
                                                <th>Минимум</th>
                                                <th>Статус</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.items.map((item) => (
                                                <StockRow
                                                    key={item.materialId}
                                                    item={item}
                                                    highlighted={item.materialId === targetMaterialId}
                                                    orderMode={orderMode}
                                                    onDragStart={() => setDraggedId(item.materialId)}
                                                    onDrop={() => void reorder(item.materialId)}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </section>
                ))}
                {!loading && standardCategories.length === 0 && (
                    <div style={styles.empty}>Обычные материалы не найдены.</div>
                )}
            </StockSection>

            <StockSection
                title="ORACAL 641"
                subtitle="Отдельный склад по кодам цветов и ширинам"
                actions={(
                    <>
                        <button className="button secondary" type="button" disabled={exportItems.length === 0} onClick={() => exportStockExcel(exportItems, 'oracal')}>
                            <FileSpreadsheet size={16} /> Excel
                        </button>
                        <button className="button secondary" type="button" disabled={exportItems.length === 0} onClick={() => runPdfExport('oracal')}>
                            <FileText size={16} /> PDF
                        </button>
                    </>
                )}
            >
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th aria-label="Порядок" />
                                <th>Цвет</th>
                                <th>Материал - ширина</th>
                                <th>Остаток</th>
                                <th>Минимум</th>
                                <th>В пути</th>
                                <th>Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {oracalItems.map((item) => (
                                <tr
                                    key={item.materialId}
                                    className={item.materialId === targetMaterialId ? 'highlighted-row' : undefined}
                                    draggable={orderMode}
                                    onDragStart={() => setDraggedId(item.materialId)}
                                    onDragOver={(event) => orderMode && event.preventDefault()}
                                    onDrop={() => void reorder(item.materialId)}
                                >
                                    <td className={orderMode ? 'drag-cell' : undefined}>
                                        {orderMode ? <GripVertical size={17} /> : <Lock size={14} />}
                                    </td>
                                    <td>
                                        <span style={styles.colorCell}>
                                            <i style={{ ...styles.swatch, background: item.colorHex ?? '#777' }} />
                                            <span><strong>{item.colorCode ?? '—'}</strong><small>{item.colorName ?? 'Без названия'}</small></span>
                                        </span>
                                    </td>
                                    <td><strong>{materialDisplayName(item)}</strong><small style={styles.article}>{item.article}</small></td>
                                    <QuantityCell item={item} value={item.currentQuantity} expected />
                                    <td>{formatNumber.format(item.minimumQuantity)} {unitLabel(item.unit)}</td>
                                    <td>{formatNumber.format(item.expectedQuantity)} {unitLabel(item.unit)}</td>
                                    <StatusCell item={item} />
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {!loading && oracalItems.length === 0 && <div style={styles.empty}>Материалы Oracal не найдены.</div>}
            </StockSection>
        </div>
    );
}

function StockSection({
    title,
    subtitle,
    actions,
    children,
}: {
    title: string;
    subtitle: string;
    actions: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="panel" style={styles.stockSection}>
            <div style={styles.sectionHeader}>
                <div><h2>{title}</h2><p>{subtitle}</p></div>
                <div style={styles.exportActions}>{actions}</div>
            </div>
            {children}
        </section>
    );
}

function StockRow({
    item,
    highlighted,
    orderMode,
    onDragStart,
    onDrop,
}: {
    item: StockItem;
    highlighted: boolean;
    orderMode: boolean;
    onDragStart: () => void;
    onDrop: () => void;
}) {
    return (
        <tr
            className={highlighted ? 'highlighted-row' : undefined}
            draggable={orderMode}
            onDragStart={onDragStart}
            onDragOver={(event) => orderMode && event.preventDefault()}
            onDrop={onDrop}
        >
            <td className={orderMode ? 'drag-cell' : undefined}>
                {orderMode ? <GripVertical size={17} /> : <Lock size={14} />}
            </td>
            <td><strong>{materialDisplayName(item)}</strong></td>
            <td>{item.article}</td>
            <QuantityCell item={item} value={item.currentQuantity} expected />
            <td>{formatNumber.format(item.minimumQuantity)} {unitLabel(item.unit)}</td>
            <StatusCell item={item} />
        </tr>
    );
}

function QuantityCell({
    item,
    value,
    expected = false,
}: {
    item: StockItem;
    value: number;
    expected?: boolean;
}) {
    return (
        <td>
            <strong>{formatNumber.format(value)} {unitLabel(item.unit)}</strong>
            {expected && item.expectedQuantity > 0 && (
                <button
                    type="button"
                    className="expected-link"
                    title="Открыть счета и поставки"
                    onClick={() => window.location.assign('/supplies')}
                >
                    +{formatNumber.format(item.expectedQuantity)} {unitLabel(item.unit)} в пути
                </button>
            )}
        </td>
    );
}

function StatusCell({ item }: { item: StockItem }) {
    return (
        <td>
            <span style={item.belowMinimum ? styles.statusWarning : styles.statusOk}>
                {item.currentQuantity <= 0
                    ? 'Нет на складе'
                    : item.belowMinimum
                        ? 'Ниже минимума'
                        : 'В норме'}
            </span>
        </td>
    );
}

function buildCategoryGroups(items: StockItem[]) {
    const categories = new Map<string, CategoryGroup>();

    for (const item of items) {
        const category = categories.get(item.categoryId) ?? {
            id: item.categoryId,
            name: item.categoryName,
            materials: [],
        };
        const normalizedName = normalizeMaterialName(item.materialName);
        let material = category.materials.find(
            (group) => group.name.toLowerCase() === normalizedName.toLowerCase(),
        );
        if (!material) {
            material = {
                key: `${item.categoryId}:${normalizedName.toLowerCase()}`,
                name: normalizedName,
                items: [],
            };
            category.materials.push(material);
        }
        material.items.push(item);
        categories.set(item.categoryId, category);
    }

    return [...categories.values()].map((category) => ({
        ...category,
        materials: category.materials.map((material) => ({
            ...material,
            items: material.items
                .slice()
                .sort((a, b) => Number(b.widthMeters ?? 0) - Number(a.widthMeters ?? 0)),
        })),
    }));
}

function normalizeMaterialName(value: string) {
    return value.replace(/\s+-?\s*\d+[.,]\d+\s*м\s*$/i, '').trim();
}

function Stat({
    label,
    value,
    icon,
    warning = false,
}: {
    label: string;
    value: number;
    icon: ReactNode;
    warning?: boolean;
}) {
    return (
        <article className="stat-card">
            <div className="stat-icon" style={warning ? styles.warningIcon : undefined}>{icon}</div>
            <div><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div>
        </article>
    );
}

function unitLabel(unit: string) {
    const labels: Record<string, string> = {
        Piece: 'шт.', Meter: 'м', SquareMeter: 'м²', Kilogram: 'кг',
        Liter: 'л', Roll: 'рул.', Sheet: 'лист',
    };
    return labels[unit] ?? unit;
}

const styles: Record<string, CSSProperties> = {
    stats: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 15 },
    toolbar: { display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between' },
    searchBox: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 320, flex: 1, color: '#7f8a9b' },
    searchInput: { width: '100%', border: 0, outline: 0, background: 'transparent', color: '#f5f7fb', font: 'inherit' },
    checkbox: { display: 'flex', gap: 8, alignItems: 'center', color: '#b8c0ce', fontSize: 14 },
    orderHint: { marginTop: 12, display: 'flex', gap: 9, alignItems: 'center', border: '1px solid rgba(74,166,255,.4)', background: 'rgba(74,166,255,.09)', color: '#dce7f7', borderRadius: 12, padding: '11px 14px' },
    lockHint: { marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', color: '#7f8a9b', fontSize: 13 },
    error: { marginTop: 15, border: '1px solid rgba(244,91,105,.35)', background: 'rgba(244,91,105,.08)', color: '#ff9ca5', borderRadius: 12, padding: '12px 14px' },
    stockSection: { marginTop: 18 },
    sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 16 },
    exportActions: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    categoryCard: { border: '1px solid #26313e', borderRadius: 14, overflow: 'hidden', marginBottom: 14, background: '#0d141c' },
    categoryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 17px', borderBottom: '1px solid #26313e', background: 'rgba(74,166,255,.07)' },
    draggableCategoryHeader: { cursor: 'grab', outline: '1px dashed rgba(74,166,255,.35)', outlineOffset: -5 },
    categoryTitleWrap: { display: 'flex', alignItems: 'center', gap: 11 },
    materialGroup: { padding: '14px 15px 16px' },
    materialGroupTitle: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9, color: '#aeb8c7' },
    colorCell: { display: 'flex', alignItems: 'center', gap: 10 },
    swatch: { width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(255,255,255,.22)', flex: '0 0 auto' },
    article: { display: 'block', color: '#778496', marginTop: 3 },
    statusOk: { color: '#54d99c', fontWeight: 700, fontSize: 13 },
    statusWarning: { color: '#ffb454', fontWeight: 700, fontSize: 13 },
    warningIcon: { color: '#ffb454' },
    empty: { padding: 28, textAlign: 'center', color: '#7f8a9b' },
};

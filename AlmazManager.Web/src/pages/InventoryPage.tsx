import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    Check,
    CheckCircle2,
    ClipboardCheck,
    Minus,
    Plus,
    RefreshCcw,
    RotateCcw,
    Search,
} from 'lucide-react';

import api from '../api/api';

type MaterialCatalogItem = {
    id: string;
    name: string;
    article: string;
    categoryId: string;
    unit: string;
    minimumQuantity: number;
    currentQuantity: number;
    belowMinimum: boolean;
    isActive: boolean;
    kind: string;
    widthMeters?: number | null;
};

type MaterialCatalogResponse = {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: MaterialCatalogItem[];
};

type InventoryRow = {
    materialId: string;
    name: string;
    article: string;
    widthMeters?: number | null;
    expectedQuantity: number;
    actualQuantity: number;
    counted: boolean;
};

type StandardGroup = {
    key: string;
    name: string;
    rows: InventoryRow[];
};

type InventoryDocumentResponse = {
    id: string;
    number: string;
    status: string;
    userId: string;
    comment?: string | null;
};

const numberFormatter =
    new Intl.NumberFormat(
        'ru-RU',
        {
            maximumFractionDigits: 2,
        },
    );

export default function InventoryPage() {
    const [rows, setRows] =
        useState<InventoryRow[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [search, setSearch] =
        useState('');

    const [onlyChanged, setOnlyChanged] =
        useState(false);

    const [comment, setComment] =
        useState('');

    useEffect(() => {
        loadMaterials();
    }, []);

    async function loadMaterials() {
        try {
            setLoading(true);
            setError('');

            const response =
                await api.get<MaterialCatalogResponse>(
                    '/materials/catalog?pageSize=100',
                );

            const materials =
                response.data.items.filter(
                    material =>
                        material.isActive &&
                        material.kind !==
                        'Oracal641',
                );

            setRows(
                materials.map(
                    material => ({
                        materialId:
                            material.id,

                        name:
                            material.name,

                        article:
                            material.article,

                        widthMeters:
                            material.widthMeters,

                        expectedQuantity:
                            material.currentQuantity,

                        actualQuantity:
                            0,

                        counted:
                            false,
                    }),
                ),
            );
        } catch (
        requestError: any
        ) {
            console.error(
                requestError,
            );

            setError(
                requestError?.response?.data
                    ?.message ??
                requestError?.response?.data
                    ?.title ??
                'Не удалось загрузить материалы.',
            );
        } finally {
            setLoading(false);
        }
    }

    const groups =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    StandardGroup
                >();

            for (const row of rows) {
                const name =
                    normalizeMaterialName(
                        row.name,
                    );

                const key =
                    name
                        .trim()
                        .toLowerCase();

                const group =
                    map.get(key) ?? {
                        key,
                        name,
                        rows: [],
                    };

                group.rows.push(row);
                map.set(key, group);
            }

            return Array.from(
                map.values(),
            )
                .map(group => ({
                    ...group,

                    rows:
                        group.rows
                            .slice()
                            .sort(
                                (a, b) =>
                                    Number(
                                        b.widthMeters ??
                                        0,
                                    ) -
                                    Number(
                                        a.widthMeters ??
                                        0,
                                    ),
                            ),
                }))
                .sort(
                    (a, b) =>
                        a.name.localeCompare(
                            b.name,
                            'ru',
                        ),
                );
        }, [rows]);

    const countedRows =
        rows.filter(
            row => row.counted,
        );

    const changedRows =
        countedRows.filter(
            row =>
                row.actualQuantity !==
                row.expectedQuantity,
        );

    const matchedRows =
        countedRows.filter(
            row =>
                row.actualQuantity ===
                row.expectedQuantity,
        );

    const notCountedRows =
        rows.filter(
            row => !row.counted,
        );

    const negativeChanges =
        changedRows.filter(
            row =>
                row.actualQuantity <
                row.expectedQuantity,
        ).length;

    const positiveChanges =
        changedRows.filter(
            row =>
                row.actualQuantity >
                row.expectedQuantity,
        ).length;

    const filteredGroups =
        useMemo(() => {
            const normalized =
                search
                    .trim()
                    .toLowerCase();

            return groups
                .map(group => ({
                    ...group,

                    rows:
                        group.rows.filter(
                            row => {
                                const matchesSearch =
                                    !normalized ||
                                    group.name
                                        .toLowerCase()
                                        .includes(
                                            normalized,
                                        ) ||
                                    row.article
                                        .toLowerCase()
                                        .includes(
                                            normalized,
                                        );

                                const difference =
                                    row.actualQuantity -
                                    row.expectedQuantity;

                                const matchesChanged =
                                    !onlyChanged ||
                                    (
                                        row.counted &&
                                        difference !== 0
                                    );

                                return (
                                    matchesSearch &&
                                    matchesChanged
                                );
                            },
                        ),
                }))
                .filter(
                    group =>
                        group.rows.length >
                        0,
                );
        }, [
            groups,
            search,
            onlyChanged,
        ]);

    function changeActualQuantity(
        materialId: string,
        value: number,
    ) {
        setRows(
            current =>
                current.map(
                    row => {
                        if (
                            row.materialId !==
                            materialId
                        ) {
                            return row;
                        }

                        const next =
                            Math.max(
                                0,
                                Math.round(
                                    Number.isFinite(
                                        value,
                                    )
                                        ? value
                                        : 0,
                                ),
                            );

                        return {
                            ...row,
                            actualQuantity:
                                next,
                            counted:
                                true,
                        };
                    },
                ),
        );
    }

    function stepQuantity(
        materialId: string,
        delta: number,
    ) {
        const row =
            rows.find(
                item =>
                    item.materialId ===
                    materialId,
            );

        if (!row) {
            return;
        }

        changeActualQuantity(
            materialId,
            row.actualQuantity +
            delta,
        );
    }

    function confirmZero(
        materialId: string,
    ) {
        setRows(
            current =>
                current.map(
                    row =>
                        row.materialId ===
                            materialId
                            ? {
                                ...row,
                                actualQuantity:
                                    0,
                                counted:
                                    true,
                            }
                            : row,
                ),
        );
    }

    function resetRow(
        materialId: string,
    ) {
        setRows(
            current =>
                current.map(
                    row =>
                        row.materialId ===
                            materialId
                            ? {
                                ...row,
                                actualQuantity:
                                    0,
                                counted:
                                    false,
                            }
                            : row,
                ),
        );
    }

    function resetAll() {
        if (
            countedRows.length === 0
        ) {
            return;
        }

        if (
            !window.confirm(
                'Сбросить текущий подсчёт?',
            )
        ) {
            return;
        }

        setRows(
            current =>
                current.map(
                    row => ({
                        ...row,
                        actualQuantity:
                            0,
                        counted:
                            false,
                    }),
                ),
        );
    }

    async function postInventory() {
        if (
            countedRows.length === 0
        ) {
            setError(
                'Сначала посчитайте хотя бы одну позицию.',
            );

            return;
        }

        if (
            notCountedRows.length > 0
        ) {
            const confirmed =
                window.confirm(
                    `Посчитано ${countedRows.length} из ${rows.length} позиций.\n\n` +
                    'Непосчитанные материалы не будут изменены.\n\n' +
                    'Продолжить?',
                );

            if (!confirmed) {
                return;
            }
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const createResponse =
                await api.post<InventoryDocumentResponse>(
                    '/inventory-documents',
                    {
                        comment:
                            comment.trim() ||
                            'Инвентаризация основного склада',

                        items:
                            countedRows.map(
                                row => ({
                                    materialId:
                                        row.materialId,

                                    actualQuantity:
                                        row.actualQuantity,
                                }),
                            ),
                    },
                );

            const document =
                createResponse.data;

            const postResponse =
                await api.post<InventoryDocumentResponse>(
                    `/inventory-documents/${document.id}/post`,
                );

            setSuccess(
                `Инвентаризация ${postResponse.data.number} успешно проведена.`,
            );

            setComment('');
            setOnlyChanged(false);

            await loadMaterials();
        } catch (
        requestError: any
        ) {
            console.error(
                requestError,
            );

            setError(
                requestError?.response?.data
                    ?.message ??
                requestError?.response?.data
                    ?.title ??
                'Не удалось провести инвентаризацию.',
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        WAREHOUSE
                    </p>

                    <h1>
                        Инвентаризация склада
                    </h1>

                    <p>
                        Пересчёт штучных
                        материалов склада.
                    </p>
                </div>

                <button
                    type="button"
                    className="button secondary"
                    onClick={
                        loadMaterials
                    }
                >
                    <RefreshCcw
                        size={17}
                    />

                    Начать заново
                </button>
            </div>

            {error && (
                <div
                    style={
                        styles.errorBox
                    }
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    style={
                        styles.successBox
                    }
                >
                    <CheckCircle2
                        size={18}
                    />

                    {success}
                </div>
            )}

            <section
                style={
                    styles.stats
                }
            >
                <Stat
                    title="Всего"
                    value={
                        rows.length
                    }
                />

                <Stat
                    title="Посчитано"
                    value={
                        countedRows.length
                    }
                />

                <Stat
                    title="Совпало"
                    value={
                        matchedRows.length
                    }
                />

                <Stat
                    title="Расхождений"
                    value={
                        changedRows.length
                    }
                />

                <Stat
                    title="Недостача"
                    value={
                        negativeChanges
                    }
                />

                <Stat
                    title="Излишек"
                    value={
                        positiveChanges
                    }
                />
            </section>

            <section className="panel">
                <div
                    style={
                        styles.toolbar
                    }
                >
                    <div
                        style={
                            styles.search
                        }
                    >
                        <Search
                            size={17}
                        />

                        <input
                            value={
                                search
                            }
                            onChange={
                                event =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                            }
                            placeholder="Поиск материала..."
                            style={
                                styles.searchInput
                            }
                        />
                    </div>

                    <label
                        style={
                            styles.filter
                        }
                    >
                        <input
                            type="checkbox"
                            checked={
                                onlyChanged
                            }
                            onChange={
                                event =>
                                    setOnlyChanged(
                                        event
                                            .target
                                            .checked,
                                    )
                            }
                        />

                        Только расхождения
                    </label>
                </div>
            </section>

            {loading ? (
                <section
                    className="panel"
                    style={{
                        marginTop:
                            15,
                    }}
                >
                    <div
                        style={
                            styles.empty
                        }
                    >
                        Загрузка...
                    </div>
                </section>
            ) : (
                filteredGroups.map(
                    group => (
                        <section
                            key={
                                group.key
                            }
                            className="panel"
                            style={{
                                marginTop:
                                    15,
                            }}
                        >
                            <div
                                style={
                                    styles.groupHeader
                                }
                            >
                                <div>
                                    <h2
                                        style={
                                            styles.groupTitle
                                        }
                                    >
                                        {
                                            group.name
                                        }
                                    </h2>

                                    <span
                                        style={
                                            styles.muted
                                        }
                                    >
                                        {
                                            group.rows
                                                .length
                                        }{' '}
                                        ширин
                                    </span>
                                </div>
                            </div>

                            <div
                                style={{
                                    ...styles.grid,
                                    ...styles.header,
                                }}
                            >
                                <div>
                                    Ширина
                                </div>

                                <div>
                                    Фактический
                                    подсчёт
                                </div>

                                <div>
                                    По системе
                                </div>

                                <div>
                                    Разница
                                </div>

                                <div>
                                    Статус
                                </div>
                            </div>

                            {group.rows.map(
                                row => {
                                    const difference =
                                        row.actualQuantity -
                                        row.expectedQuantity;

                                    return (
                                        <div
                                            key={
                                                row.materialId
                                            }
                                            style={{
                                                ...styles.grid,
                                                ...styles.row,

                                                ...(row.counted &&
                                                    difference !==
                                                    0
                                                    ? styles.changedRow
                                                    : {}),
                                            }}
                                        >
                                            <div>
                                                <strong
                                                    style={
                                                        styles.width
                                                    }
                                                >
                                                    {row.widthMeters
                                                        ? formatWidth(
                                                            row.widthMeters,
                                                        )
                                                        : '—'}
                                                </strong>

                                                <div
                                                    style={
                                                        styles.article
                                                    }
                                                >
                                                    {
                                                        row.article
                                                    }
                                                </div>
                                            </div>

                                            <div
                                                style={
                                                    styles.fact
                                                }
                                            >
                                                <div
                                                    style={
                                                        styles.counter
                                                    }
                                                >
                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.counterButton
                                                        }
                                                        onClick={() =>
                                                            stepQuantity(
                                                                row.materialId,
                                                                -1,
                                                            )
                                                        }
                                                    >
                                                        <Minus
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>

                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="1"
                                                        value={
                                                            row.actualQuantity
                                                        }
                                                        onChange={
                                                            event =>
                                                                changeActualQuantity(
                                                                    row.materialId,
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                )
                                                        }
                                                        style={
                                                            styles.factInput
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.counterButton
                                                        }
                                                        onClick={() =>
                                                            stepQuantity(
                                                                row.materialId,
                                                                1,
                                                            )
                                                        }
                                                    >
                                                        <Plus
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    </button>

                                                    <span
                                                        style={
                                                            styles.muted
                                                        }
                                                    >
                                                        шт.
                                                    </span>
                                                </div>

                                                {!row.counted && (
                                                    <button
                                                        type="button"
                                                        style={
                                                            styles.zeroButton
                                                        }
                                                        onClick={() =>
                                                            confirmZero(
                                                                row.materialId,
                                                            )
                                                        }
                                                    >
                                                        <Check
                                                            size={
                                                                12
                                                            }
                                                        />
                                                        Подтвердить
                                                        0
                                                    </button>
                                                )}
                                            </div>

                                            <strong>
                                                {numberFormatter.format(
                                                    row.expectedQuantity,
                                                )}{' '}
                                                шт.
                                            </strong>

                                            <Difference
                                                counted={
                                                    row.counted
                                                }
                                                value={
                                                    difference
                                                }
                                            />

                                            <Status
                                                counted={
                                                    row.counted
                                                }
                                                difference={
                                                    difference
                                                }
                                                onReset={() =>
                                                    resetRow(
                                                        row.materialId,
                                                    )
                                                }
                                            />
                                        </div>
                                    );
                                },
                            )}
                        </section>
                    ),
                )
            )}

            <section
                className="panel"
                style={{
                    marginTop:
                        20,
                }}
            >
                <div
                    style={
                        styles.footer
                    }
                >
                    <label
                        style={
                            styles.comment
                        }
                    >
                        <span>
                            Комментарий
                        </span>

                        <textarea
                            value={
                                comment
                            }
                            onChange={
                                event =>
                                    setComment(
                                        event
                                            .target
                                            .value,
                                    )
                            }
                            style={
                                styles.textarea
                            }
                            placeholder="Комментарий к инвентаризации..."
                        />
                    </label>

                    <div
                        style={
                            styles.actions
                        }
                    >
                        <div
                            style={
                                styles.progress
                            }
                        >
                            {countedRows.length}
                            {' / '}
                            {rows.length}{' '}
                            посчитано
                        </div>

                        <button
                            type="button"
                            className="button secondary"
                            disabled={
                                countedRows.length ===
                                0
                            }
                            onClick={
                                resetAll
                            }
                        >
                            <RotateCcw
                                size={17}
                            />
                            Сбросить
                        </button>

                        <button
                            type="button"
                            className="button primary"
                            disabled={
                                saving ||
                                countedRows.length ===
                                0
                            }
                            onClick={
                                postInventory
                            }
                        >
                            <ClipboardCheck
                                size={18}
                            />

                            {saving
                                ? 'Проведение...'
                                : 'Провести'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function Difference({
    counted,
    value,
}: {
    counted: boolean;
    value: number;
}) {
    if (!counted) {
        return (
            <span
                style={
                    styles.emptyDifference
                }
            >
                —
            </span>
        );
    }

    return (
        <strong
            style={{
                color:
                    value < 0
                        ? '#fca5a5'
                        : value > 0
                            ? '#86efac'
                            : '#94a3b8',
            }}
        >
            {value > 0
                ? '+'
                : ''}
            {numberFormatter.format(
                value,
            )}{' '}
            шт.
        </strong>
    );
}

function Status({
    counted,
    difference,
    onReset,
}: {
    counted: boolean;
    difference: number;
    onReset: () => void;
}) {
    if (!counted) {
        return (
            <span
                style={
                    styles.notCounted
                }
            >
                Не посчитано
            </span>
        );
    }

    return (
        <div
            style={
                styles.status
            }
        >
            <span
                style={
                    difference === 0
                        ? styles.match
                        : styles.difference
                }
            >
                {difference === 0
                    ? 'Совпадает'
                    : 'Расхождение'}
            </span>

            <button
                type="button"
                style={
                    styles.reset
                }
                onClick={
                    onReset
                }
            >
                Сбросить
            </button>
        </div>
    );
}

function Stat({
    title,
    value,
}: {
    title: string;
    value: number;
}) {
    return (
        <div
            style={
                styles.stat
            }
        >
            <span
                style={
                    styles.muted
                }
            >
                {title}
            </span>

            <strong
                style={{
                    fontSize:
                        22,
                }}
            >
                {value}
            </strong>
        </div>
    );
}

function normalizeMaterialName(
    name: string,
) {
    return name
        .replace(
            /\s+\d+[.,]\d+\s*м\s*$/i,
            '',
        )
        .trim();
}

function formatWidth(
    value: number,
) {
    return `${value.toLocaleString(
        'ru-RU',
        {
            minimumFractionDigits:
                2,
            maximumFractionDigits:
                2,
        },
    )} м`;
}

const styles: Record<
    string,
    CSSProperties
> = {
    stats: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(6, minmax(0, 1fr))',
        gap: 10,
        marginBottom: 18,
    },

    stat: {
        display: 'grid',
        gap: 4,
        padding: 14,
        border:
            '1px solid #293542',
        borderRadius: 11,
        background: '#111a24',
    },

    toolbar: {
        display: 'flex',
        gap: 12,
        padding: 16,
        alignItems: 'center',
        flexWrap: 'wrap',
    },

    search: {
        flex: '1 1 300px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 42,
        padding: '0 12px',
        border:
            '1px solid #303b4a',
        borderRadius: 10,
        background: '#111922',
    },

    searchInput: {
        flex: 1,
        border: 0,
        outline: 0,
        background: 'transparent',
        color: '#fff',
    },

    filter: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minHeight: 42,
        padding: '0 12px',
        border:
            '1px solid #303b4a',
        borderRadius: 10,
        background: '#111922',
        cursor: 'pointer',
        fontSize: 11,
    },

    groupHeader: {
        padding: '17px 20px',
        borderBottom:
            '1px solid rgba(255,255,255,.06)',
    },

    groupTitle: {
        margin: 0,
        fontSize: 23,
    },

    grid: {
        display: 'grid',
        gridTemplateColumns:
            '1fr 1.5fr .85fr .85fr 1fr',
        gap: 14,
        alignItems: 'center',
        padding: '12px 20px',
    },

    header: {
        color: '#64748b',
        fontSize: 9,
        fontWeight: 800,
        textTransform:
            'uppercase',
        borderBottom:
            '1px solid rgba(255,255,255,.06)',
    },

    row: {
        minHeight: 60,
        borderBottom:
            '1px solid rgba(255,255,255,.045)',
    },

    changedRow: {
        background:
            'rgba(245,158,11,.04)',
    },

    width: {
        fontSize: 17,
    },

    article: {
        color: '#64748b',
        fontSize: 9,
        marginTop: 3,
    },

    fact: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        flexWrap: 'wrap',
    },

    counter: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
    },

    counterButton: {
        width: 33,
        height: 33,
        display: 'grid',
        placeItems: 'center',
        border:
            '1px solid #303b4a',
        borderRadius: 8,
        background: '#151e29',
        color: '#fff',
        cursor: 'pointer',
    },

    factInput: {
        width: 78,
        height: 33,
        border:
            '1px solid #303b4a',
        borderRadius: 8,
        background: '#0e151e',
        color: '#fff',
        textAlign: 'center',
        fontWeight: 800,
    },

    zeroButton: {
        minHeight: 29,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 8px',
        border:
            '1px solid rgba(59,130,246,.25)',
        borderRadius: 7,
        background:
            'rgba(59,130,246,.08)',
        color: '#93c5fd',
        cursor: 'pointer',
        fontSize: 9,
    },

    muted: {
        color: '#77879a',
        fontSize: 10,
    },

    emptyDifference: {
        color: '#475569',
    },

    notCounted: {
        display: 'inline-flex',
        padding: '5px 8px',
        borderRadius: 999,
        background:
            'rgba(148,163,184,.06)',
        color: '#94a3b8',
        fontSize: 9,
    },

    match: {
        display: 'inline-flex',
        padding: '5px 8px',
        borderRadius: 999,
        background:
            'rgba(34,197,94,.10)',
        color: '#86efac',
        fontSize: 9,
    },

    difference: {
        display: 'inline-flex',
        padding: '5px 8px',
        borderRadius: 999,
        background:
            'rgba(245,158,11,.10)',
        color: '#fbbf24',
        fontSize: 9,
    },

    status: {
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        flexWrap: 'wrap',
    },

    reset: {
        border: 0,
        background: 'transparent',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: 9,
    },

    footer: {
        display: 'grid',
        gridTemplateColumns:
            '1fr auto',
        gap: 18,
        padding: 18,
        alignItems: 'end',
    },

    comment: {
        display: 'grid',
        gap: 7,
        fontSize: 11,
        fontWeight: 700,
    },

    textarea: {
        width: '100%',
        minHeight: 80,
        boxSizing:
            'border-box',
        resize: 'vertical',
        border:
            '1px solid #303b4a',
        borderRadius: 10,
        background: '#151e29',
        color: '#fff',
        padding: 12,
    },

    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        flexWrap: 'wrap',
        justifyContent:
            'flex-end',
    },

    progress: {
        padding: '6px 9px',
        borderRadius: 999,
        background:
            'rgba(59,130,246,.08)',
        color: '#93c5fd',
        fontSize: 10,
    },

    empty: {
        padding: 30,
        textAlign: 'center',
        color: '#77879a',
    },

    errorBox: {
        padding: '12px 14px',
        marginBottom: 16,
        border:
            '1px solid rgba(239,68,68,.25)',
        borderRadius: 10,
        background:
            'rgba(127,29,29,.18)',
        color: '#fca5a5',
    },

    successBox: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 14px',
        marginBottom: 16,
        border:
            '1px solid rgba(34,197,94,.25)',
        borderRadius: 10,
        background:
            'rgba(20,83,45,.18)',
        color: '#86efac',
    },
};
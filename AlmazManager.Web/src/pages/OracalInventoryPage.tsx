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
    colorCode?: string | null;
    colorName?: string | null;
    colorHex?: string | null;
};

type MaterialCatalogResponse = {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: MaterialCatalogItem[];
};

type OracalInventoryRow = {
    materialId: string;
    article: string;
    widthMeters: number;
    colorCode: string;
    colorName: string;
    colorHex: string;
    expectedQuantity: number;
    actualQuantity: number;
    counted: boolean;
};

type OracalGroup = {
    key: string;
    code: string;
    name: string;
    hex: string;
    width100?: OracalInventoryRow;
    width127?: OracalInventoryRow;
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

export default function OracalInventoryPage() {
    const [rows, setRows] =
        useState<OracalInventoryRow[]>([]);

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
        loadOracal();
    }, []);

    async function loadOracal() {
        try {
            setLoading(true);
            setError('');

            const response =
                await api.get<MaterialCatalogResponse>(
                    '/materials/catalog?pageSize=100',
                );

            const oracal =
                response.data.items.filter(
                    material =>
                        material.isActive &&
                        material.kind ===
                        'Oracal641' &&
                        material.widthMeters,
                );

            setRows(
                oracal.map(
                    material => ({
                        materialId:
                            material.id,

                        article:
                            material.article,

                        widthMeters:
                            Number(
                                material.widthMeters,
                            ),

                        colorCode:
                            material.colorCode ??
                            '—',

                        colorName:
                            material.colorName ??
                            'Без названия',

                        colorHex:
                            material.colorHex ??
                            '#777777',

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
                'Не удалось загрузить ORACAL.',
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
                    OracalGroup
                >();

            for (const row of rows) {
                const key =
                    row.colorCode.toLowerCase();

                const group =
                    map.get(key) ?? {
                        key,

                        code:
                            row.colorCode,

                        name:
                            row.colorName,

                        hex:
                            row.colorHex,
                    };

                if (
                    isWidth(
                        row.widthMeters,
                        1,
                    )
                ) {
                    group.width100 =
                        row;
                }

                if (
                    isWidth(
                        row.widthMeters,
                        1.27,
                    )
                ) {
                    group.width127 =
                        row;
                }

                map.set(
                    key,
                    group,
                );
            }

            return Array.from(
                map.values(),
            ).sort(
                (a, b) =>
                    a.code.localeCompare(
                        b.code,
                        'ru',
                        {
                            numeric: true,
                        },
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

    const filteredGroups =
        useMemo(() => {
            const value =
                search
                    .trim()
                    .toLowerCase();

            return groups.filter(
                group => {
                    const groupRows =
                        [
                            group.width100,
                            group.width127,
                        ].filter(
                            Boolean,
                        ) as OracalInventoryRow[];

                    const matchesSearch =
                        !value ||
                        group.code
                            .toLowerCase()
                            .includes(value) ||
                        group.name
                            .toLowerCase()
                            .includes(value);

                    const hasDifference =
                        groupRows.some(
                            row =>
                                row.counted &&
                                row.actualQuantity !==
                                row.expectedQuantity,
                        );

                    return (
                        matchesSearch &&
                        (
                            !onlyChanged ||
                            hasDifference
                        )
                    );
                },
            );
        }, [
            groups,
            search,
            onlyChanged,
        ]);

    function changeActual(
        materialId: string,
        value: number,
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
                                    Math.max(
                                        0,
                                        Number.isFinite(
                                            value,
                                        )
                                            ? value
                                            : 0,
                                    ),

                                counted:
                                    true,
                            }
                            : row,
                ),
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
                'Сбросить текущий подсчёт ORACAL?',
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
                'Сначала посчитайте хотя бы один цвет ORACAL.',
            );

            return;
        }

        if (
            notCountedRows.length > 0
        ) {
            const confirmed =
                window.confirm(
                    `Посчитано ${countedRows.length} из ${rows.length} позиций ORACAL.\n\n` +
                    'Непосчитанные позиции не будут изменены.\n\n' +
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
                            'Инвентаризация ORACAL 641',

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
                `Инвентаризация ORACAL ${postResponse.data.number} успешно проведена.`,
            );

            setComment('');
            setOnlyChanged(false);

            await loadOracal();
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
                'Не удалось провести инвентаризацию ORACAL.',
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
                        VINYL INVENTORY
                    </p>

                    <h1>
                        Инвентаризация ORACAL
                    </h1>

                    <p>
                        Отдельный пересчёт
                        ORACAL 641 по цветам и
                        ширинам.
                    </p>
                </div>

                <button
                    type="button"
                    className="button secondary"
                    onClick={
                        loadOracal
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
                    title="Позиций"
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
                            placeholder="Поиск цвета..."
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

            <section
                className="panel"
                style={{
                    marginTop:
                        15,
                }}
            >
                {loading ? (
                    <div
                        style={
                            styles.empty
                        }
                    >
                        Загрузка...
                    </div>
                ) : (
                    <div
                        style={
                            styles.tableScroll
                        }
                    >
                        <div
                            style={
                                styles.header
                            }
                        >
                            <div>
                                Цвет
                            </div>

                            <WidthHeader
                                title="1,00 м"
                            />

                            <WidthHeader
                                title="1,27 м"
                            />

                            <div>
                                Статус
                            </div>
                        </div>

                        {filteredGroups.map(
                            group => (
                                <OracalRow
                                    key={
                                        group.key
                                    }
                                    group={
                                        group
                                    }
                                    onChange={
                                        changeActual
                                    }
                                    onConfirmZero={
                                        confirmZero
                                    }
                                    onReset={
                                        resetRow
                                    }
                                />
                            ),
                        )}
                    </div>
                )}
            </section>

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
                            placeholder="Комментарий к инвентаризации ORACAL..."
                        />
                    </label>

                    <div
                        style={
                            styles.actions
                        }
                    >
                        <span
                            style={
                                styles.progress
                            }
                        >
                            {countedRows.length}
                            {' / '}
                            {rows.length}
                        </span>

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
                                : 'Провести ORACAL'}
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}

function WidthHeader({
    title,
}: {
    title: string;
}) {
    return (
        <div
            style={
                styles.widthHeader
            }
        >
            <strong>
                {title}
            </strong>

            <div
                style={
                    styles.subHeader
                }
            >
                <span>
                    Факт
                </span>

                <span>
                    Система
                </span>

                <span>
                    Разница
                </span>
            </div>
        </div>
    );
}

function OracalRow({
    group,
    onChange,
    onConfirmZero,
    onReset,
}: {
    group: OracalGroup;

    onChange:
    (
        id: string,
        value: number,
    ) => void;

    onConfirmZero:
    (
        id: string,
    ) => void;

    onReset:
    (
        id: string,
    ) => void;
}) {
    const groupRows =
        [
            group.width100,
            group.width127,
        ].filter(
            Boolean,
        ) as OracalInventoryRow[];

    const counted =
        groupRows.filter(
            row =>
                row.counted,
        );

    const changed =
        counted.filter(
            row =>
                row.actualQuantity !==
                row.expectedQuantity,
        );

    const allCounted =
        counted.length ===
        groupRows.length &&
        groupRows.length > 0;

    return (
        <div
            style={{
                ...styles.row,

                ...(changed.length >
                    0
                    ? styles.changedRow
                    : {}),
            }}
        >
            <div
                style={
                    styles.color
                }
            >
                <div
                    style={{
                        ...styles.swatch,
                        background:
                            group.hex,
                    }}
                />

                <div>
                    <strong>
                        {group.code}{' '}
                        {group.name}
                    </strong>

                    <div
                        style={
                            styles.muted
                        }
                    >
                        ORACAL 641
                    </div>
                </div>
            </div>

            <WidthCells
                row={
                    group.width100
                }
                onChange={
                    onChange
                }
                onConfirmZero={
                    onConfirmZero
                }
            />

            <WidthCells
                row={
                    group.width127
                }
                onChange={
                    onChange
                }
                onConfirmZero={
                    onConfirmZero
                }
            />

            <div
                style={
                    styles.status
                }
            >
                {counted.length ===
                    0 ? (
                    <span
                        style={
                            styles.notCounted
                        }
                    >
                        Не посчитано
                    </span>
                ) : changed.length >
                    0 ? (
                    <span
                        style={
                            styles.difference
                        }
                    >
                        Расхождение
                    </span>
                ) : allCounted ? (
                    <span
                        style={
                            styles.match
                        }
                    >
                        Совпадает
                    </span>
                ) : (
                    <span
                        style={
                            styles.partial
                        }
                    >
                        Частично
                    </span>
                )}

                {counted.length >
                    0 && (
                        <button
                            type="button"
                            style={
                                styles.reset
                            }
                            onClick={() => {
                                for (
                                    const row of
                                    counted
                                ) {
                                    onReset(
                                        row.materialId,
                                    );
                                }
                            }}
                        >
                            Сбросить
                        </button>
                    )}
            </div>
        </div>
    );
}

function WidthCells({
    row,
    onChange,
    onConfirmZero,
}: {
    row?:
    OracalInventoryRow;

    onChange:
    (
        id: string,
        value: number,
    ) => void;

    onConfirmZero:
    (
        id: string,
    ) => void;
}) {
    if (!row) {
        return (
            <div>
                —
            </div>
        );
    }

    const difference =
        row.actualQuantity -
        row.expectedQuantity;

    return (
        <div
            style={
                styles.widthCells
            }
        >
            <div
                style={
                    styles.fact
                }
            >
                <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={
                        row.actualQuantity
                    }
                    onChange={
                        event =>
                            onChange(
                                row.materialId,
                                Number(
                                    event
                                        .target
                                        .value,
                                ),
                            )
                    }
                    style={
                        styles.input
                    }
                />

                {!row.counted && (
                    <button
                        type="button"
                        style={
                            styles.zero
                        }
                        onClick={() =>
                            onConfirmZero(
                                row.materialId,
                            )
                        }
                        title="Подтвердить фактический остаток 0"
                    >
                        <Check
                            size={12}
                        />
                        0
                    </button>
                )}
            </div>

            <strong>
                {numberFormatter.format(
                    row.expectedQuantity,
                )}
            </strong>

            {row.counted ? (
                <strong
                    style={{
                        color:
                            difference < 0
                                ? '#fca5a5'
                                : difference >
                                    0
                                    ? '#86efac'
                                    : '#94a3b8',
                    }}
                >
                    {difference > 0
                        ? '+'
                        : ''}
                    {numberFormatter.format(
                        difference,
                    )}
                </strong>
            ) : (
                <span
                    style={
                        styles.emptyDifference
                    }
                >
                    —
                </span>
            )}
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

function isWidth(
    value: number,
    target: number,
) {
    return (
        Math.abs(
            value -
            target,
        ) <
        0.001
    );
}

const styles: Record<
    string,
    CSSProperties
> = {
    stats: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
        gap: 10,
        marginBottom: 18,
    },

    stat: {
        padding: 14,
        display: 'grid',
        gap: 4,
        border:
            '1px solid #293542',
        borderRadius: 11,
        background: '#111a24',
    },

    toolbar: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        flexWrap: 'wrap',
    },

    search: {
        flex: '1 1 300px',
        minHeight: 42,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
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
        background:
            'transparent',
        color: '#fff',
    },

    filter: {
        minHeight: 42,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 12px',
        border:
            '1px solid #303b4a',
        borderRadius: 10,
        background: '#111922',
        cursor: 'pointer',
        fontSize: 11,
    },

    tableScroll: {
        overflowX: 'auto',
    },

    header: {
        minWidth: 1050,
        display: 'grid',
        gridTemplateColumns:
            '1.45fr 2.1fr 2.1fr .8fr',
        gap: 16,
        alignItems: 'end',
        padding: '14px 18px',
        borderBottom:
            '1px solid rgba(255,255,255,.08)',
        color: '#77879a',
        fontSize: 10,
        fontWeight: 800,
        textTransform:
            'uppercase',
    },

    widthHeader: {
        display: 'grid',
        gap: 8,
    },

    subHeader: {
        display: 'grid',
        gridTemplateColumns:
            '1.2fr .8fr .8fr',
        gap: 8,
        color: '#566579',
        fontSize: 8,
    },

    row: {
        minWidth: 1050,
        display: 'grid',
        gridTemplateColumns:
            '1.45fr 2.1fr 2.1fr .8fr',
        gap: 16,
        alignItems: 'center',
        padding: '11px 18px',
        borderBottom:
            '1px solid rgba(255,255,255,.045)',
    },

    changedRow: {
        background:
            'rgba(245,158,11,.04)',
    },

    color: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },

    swatch: {
        width: 38,
        height: 38,
        flex: '0 0 auto',
        borderRadius: 8,
        border:
            '1px solid rgba(255,255,255,.22)',
    },

    widthCells: {
        display: 'grid',
        gridTemplateColumns:
            '1.2fr .8fr .8fr',
        gap: 8,
        alignItems: 'center',
    },

    fact: {
        display: 'flex',
        alignItems: 'center',
        gap: 5,
    },

    input: {
        width: '100%',
        height: 35,
        minWidth: 0,
        boxSizing:
            'border-box',
        border:
            '1px solid #303b4a',
        borderRadius: 8,
        background: '#0e151e',
        color: '#fff',
        textAlign: 'center',
        fontWeight: 800,
    },

    zero: {
        height: 30,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        border:
            '1px solid rgba(59,130,246,.25)',
        borderRadius: 7,
        background:
            'rgba(59,130,246,.08)',
        color: '#93c5fd',
        cursor: 'pointer',
        fontSize: 9,
    },

    status: {
        display: 'grid',
        justifyItems: 'start',
        gap: 5,
    },

    notCounted: {
        padding: '5px 8px',
        borderRadius: 999,
        background:
            'rgba(148,163,184,.06)',
        color: '#94a3b8',
        fontSize: 9,
    },

    difference: {
        padding: '5px 8px',
        borderRadius: 999,
        background:
            'rgba(245,158,11,.10)',
        color: '#fbbf24',
        fontSize: 9,
    },

    match: {
        padding: '5px 8px',
        borderRadius: 999,
        background:
            'rgba(34,197,94,.10)',
        color: '#86efac',
        fontSize: 9,
    },

    partial: {
        padding: '5px 8px',
        borderRadius: 999,
        background:
            'rgba(59,130,246,.08)',
        color: '#93c5fd',
        fontSize: 9,
    },

    reset: {
        border: 0,
        padding: 0,
        background:
            'transparent',
        color: '#64748b',
        cursor: 'pointer',
        fontSize: 9,
    },

    emptyDifference: {
        color: '#475569',
    },

    muted: {
        color: '#77879a',
        fontSize: 10,
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
        justifyContent:
            'flex-end',
        gap: 9,
        flexWrap: 'wrap',
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
}
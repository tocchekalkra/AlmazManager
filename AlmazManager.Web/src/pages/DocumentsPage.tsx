import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Ban,
    Clock3,
    Eye,
    FileText,
    RefreshCcw,
    RotateCcw,
    Search,
    X,
} from 'lucide-react';

import api from '../api/api';

type WarehouseDocumentItem = {
    id: string;
    materialId: string;
    quantity: number;
};

type WarehouseDocument = {
    id: string;

    number: string;

    type: string;
    status: string;

    userId: string;

    supplier?: string | null;
    externalNumber?: string | null;
    comment?: string | null;

    createdAtUtc: string;

    postedAtUtc?: string | null;
    cancelledAtUtc?: string | null;

    items: WarehouseDocumentItem[];
};

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

const numberFormatter =
    new Intl.NumberFormat(
        'ru-RU',
        {
            maximumFractionDigits: 2,
        },
    );

export default function DocumentsPage() {
    const [
        documents,
        setDocuments,
    ] =
        useState<
            WarehouseDocument[]
        >([]);

    const [
        materials,
        setMaterials,
    ] =
        useState<
            MaterialCatalogItem[]
        >([]);

    const [
        loading,
        setLoading,
    ] =
        useState(true);

    const [
        cancelling,
        setCancelling,
    ] =
        useState(false);

    const [
        error,
        setError,
    ] =
        useState('');

    const [
        success,
        setSuccess,
    ] =
        useState('');

    const [
        search,
        setSearch,
    ] =
        useState('');

    const [
        typeFilter,
        setTypeFilter,
    ] =
        useState('all');

    const [
        statusFilter,
        setStatusFilter,
    ] =
        useState('all');

    const [
        selectedDocument,
        setSelectedDocument,
    ] =
        useState<
            WarehouseDocument | null
        >(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const [
                documentsResponse,
                materialsResponse,
            ] =
                await Promise.all([
                    api.get<
                        WarehouseDocument[]
                    >(
                        '/documents',
                    ),

                    api.get<
                        MaterialCatalogResponse
                    >(
                        '/materials/catalog?pageSize=100',
                    ),
                ]);

            setDocuments(
                documentsResponse.data ??
                [],
            );

            setMaterials(
                materialsResponse
                    .data
                    .items ?? [],
            );
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка загрузки документов:',
                requestError,
            );

            setError(
                requestError
                    ?.response
                    ?.data
                    ?.message ??
                requestError
                    ?.response
                    ?.data
                    ?.title ??
                'Не удалось загрузить документы.',
            );
        } finally {
            setLoading(false);
        }
    }

    const materialMap =
        useMemo(
            () =>
                new Map(
                    materials.map(
                        material => [
                            material.id,
                            material,
                        ],
                    ),
                ),
            [materials],
        );

    const filteredDocuments =
        useMemo(() => {
            const normalized =
                search
                    .trim()
                    .toLowerCase();

            return documents
                .filter(
                    document => {
                        const matchesSearch =
                            !normalized ||
                            document.number
                                .toLowerCase()
                                .includes(
                                    normalized,
                                ) ||
                            (
                                document.supplier ??
                                ''
                            )
                                .toLowerCase()
                                .includes(
                                    normalized,
                                ) ||
                            (
                                document.externalNumber ??
                                ''
                            )
                                .toLowerCase()
                                .includes(
                                    normalized,
                                ) ||
                            (
                                document.comment ??
                                ''
                            )
                                .toLowerCase()
                                .includes(
                                    normalized,
                                );

                        const matchesType =
                            typeFilter ===
                            'all' ||
                            document.type ===
                            typeFilter;

                        const matchesStatus =
                            statusFilter ===
                            'all' ||
                            document.status ===
                            statusFilter;

                        return (
                            matchesSearch &&
                            matchesType &&
                            matchesStatus
                        );
                    },
                )
                .sort(
                    (
                        a,
                        b,
                    ) =>
                        new Date(
                            b.createdAtUtc,
                        ).getTime() -
                        new Date(
                            a.createdAtUtc,
                        ).getTime(),
                );
        }, [
            documents,
            search,
            typeFilter,
            statusFilter,
        ]);

    const receivingCount =
        documents.filter(
            document =>
                document.type ===
                'Receiving',
        ).length;

    const issueCount =
        documents.filter(
            document =>
                document.type ===
                'Issue',
        ).length;

    const postedCount =
        documents.filter(
            document =>
                document.status ===
                'Posted',
        ).length;

    const cancelledCount =
        documents.filter(
            document =>
                document.status ===
                'Cancelled',
        ).length;

    async function openDocument(
        document: WarehouseDocument,
    ) {
        try {
            setError('');

            const response =
                await api.get<
                    WarehouseDocument
                >(
                    `/documents/${document.id}`,
                );

            setSelectedDocument(
                response.data,
            );
        } catch (
        requestError: any
        ) {
            setError(
                requestError
                    ?.response
                    ?.data
                    ?.message ??
                'Не удалось открыть документ.',
            );
        }
    }

    function closeDocument() {
        if (cancelling) {
            return;
        }

        setSelectedDocument(
            null,
        );
    }

    async function cancelDocument(
        document: WarehouseDocument,
    ) {
        const confirmed =
            window.confirm(
                `Отменить документ ${document.number}?\n\n` +
                'Складские движения будут выполнены в обратную сторону.',
            );

        if (!confirmed) {
            return;
        }

        try {
            setCancelling(true);
            setError('');
            setSuccess('');

            const response =
                await api.post<
                    WarehouseDocument
                >(
                    `/documents/${document.id}/cancel`,
                );

            setSuccess(
                `Документ ${response.data.number} успешно отменён.`,
            );

            setSelectedDocument(
                response.data,
            );

            await loadData();
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка отмены документа:',
                requestError,
            );

            setError(
                requestError
                    ?.response
                    ?.data
                    ?.message ??
                requestError
                    ?.response
                    ?.data
                    ?.title ??
                'Не удалось отменить документ.',
            );
        } finally {
            setCancelling(false);
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
                        Документы
                    </h1>

                    <p>
                        История приходов,
                        расходов и складских
                        документов.
                    </p>
                </div>

                <button
                    type="button"
                    className="button secondary"
                    onClick={
                        loadData
                    }
                >
                    <RefreshCcw
                        size={17}
                    />

                    Обновить
                </button>
            </div>

            <section className="stats-grid">
                <DocumentStat
                    icon={
                        <FileText />
                    }
                    value={
                        documents.length
                    }
                    label="Всего документов"
                />

                <DocumentStat
                    icon={
                        <ArrowDownToLine />
                    }
                    value={
                        receivingCount
                    }
                    label="Приходов"
                />

                <DocumentStat
                    icon={
                        <ArrowUpFromLine />
                    }
                    value={
                        issueCount
                    }
                    label="Расходов"
                />

                <DocumentStat
                    icon={
                        <Clock3 />
                    }
                    value={
                        postedCount
                    }
                    label={`Проведено · отменено ${cancelledCount}`}
                />
            </section>

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
                    {success}
                </div>
            )}

            <section className="panel">
                <div
                    style={
                        styles.toolbar
                    }
                >
                    <div
                        style={
                            styles.searchBox
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
                            placeholder="Номер документа, поставщик, накладная..."
                            style={
                                styles.searchInput
                            }
                        />
                    </div>

                    <select
                        value={
                            typeFilter
                        }
                        onChange={
                            event =>
                                setTypeFilter(
                                    event
                                        .target
                                        .value,
                                )
                        }
                        style={
                            styles.select
                        }
                    >
                        <option value="all">
                            Все типы
                        </option>

                        <option value="Receiving">
                            Приход
                        </option>

                        <option value="Issue">
                            Расход
                        </option>
                    </select>

                    <select
                        value={
                            statusFilter
                        }
                        onChange={
                            event =>
                                setStatusFilter(
                                    event
                                        .target
                                        .value,
                                )
                        }
                        style={
                            styles.select
                        }
                    >
                        <option value="all">
                            Все статусы
                        </option>

                        <option value="Draft">
                            Черновики
                        </option>

                        <option value="Posted">
                            Проведённые
                        </option>

                        <option value="Cancelled">
                            Отменённые
                        </option>
                    </select>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    Документ
                                </th>

                                <th>
                                    Тип
                                </th>

                                <th>
                                    Дата
                                </th>

                                <th>
                                    Поставщик /
                                    накладная
                                </th>

                                <th>
                                    Позиций
                                </th>

                                <th>
                                    Статус
                                </th>

                                <th />
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={
                                            7
                                        }
                                    >
                                        Загрузка
                                        документов...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filteredDocuments.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                7
                                            }
                                        >
                                            Документы
                                            не найдены.
                                        </td>
                                    </tr>
                                )}

                            {!loading &&
                                filteredDocuments.map(
                                    document => (
                                        <tr
                                            key={
                                                document.id
                                            }
                                        >
                                            <td>
                                                <div
                                                    style={
                                                        styles.documentNumberCell
                                                    }
                                                >
                                                    <strong>
                                                        {
                                                            document.number
                                                        }
                                                    </strong>

                                                    {document.externalNumber && (
                                                        <span
                                                            style={
                                                                styles.smallText
                                                            }
                                                        >
                                                            Внешний №{' '}
                                                            {
                                                                document.externalNumber
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <DocumentTypeBadge
                                                    type={
                                                        document.type
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <div
                                                    style={
                                                        styles.dateCell
                                                    }
                                                >
                                                    <strong>
                                                        {formatDate(
                                                            document.createdAtUtc,
                                                        )}
                                                    </strong>

                                                    <span>
                                                        {formatTime(
                                                            document.createdAtUtc,
                                                        )}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <div
                                                    style={
                                                        styles.supplierCell
                                                    }
                                                >
                                                    <strong>
                                                        {document.supplier ||
                                                            '—'}
                                                    </strong>

                                                    {document.externalNumber && (
                                                        <span>
                                                            {
                                                                document.externalNumber
                                                            }
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        document
                                                            .items
                                                            .length
                                                    }
                                                </strong>
                                            </td>

                                            <td>
                                                <DocumentStatusBadge
                                                    status={
                                                        document.status
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    style={
                                                        styles.iconButton
                                                    }
                                                    onClick={() =>
                                                        openDocument(
                                                            document,
                                                        )
                                                    }
                                                    title="Открыть документ"
                                                >
                                                    <Eye
                                                        size={
                                                            17
                                                        }
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    ),
                                )}
                        </tbody>
                    </table>
                </div>

                <div
                    style={
                        styles.tableFooter
                    }
                >
                    Показано:{' '}
                    <strong>
                        {
                            filteredDocuments.length
                        }
                    </strong>{' '}
                    из{' '}
                    <strong>
                        {
                            documents.length
                        }
                    </strong>
                </div>
            </section>

            {selectedDocument && (
                <div
                    style={
                        styles.overlay
                    }
                    onMouseDown={
                        event => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                closeDocument();
                            }
                        }
                    }
                >
                    <section
                        style={
                            styles.modal
                        }
                    >
                        <div
                            style={
                                styles.modalHeader
                            }
                        >
                            <div>
                                <p className="eyebrow">
                                    WAREHOUSE
                                    DOCUMENT
                                </p>

                                <h2
                                    style={{
                                        margin:
                                            '4px 0 0',
                                    }}
                                >
                                    {
                                        selectedDocument.number
                                    }
                                </h2>
                            </div>

                            <button
                                type="button"
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeDocument
                                }
                            >
                                <X
                                    size={
                                        20
                                    }
                                />
                            </button>
                        </div>

                        <div
                            style={
                                styles.documentInfoGrid
                            }
                        >
                            <InfoCard
                                label="Тип"
                                value={
                                    selectedDocument.type ===
                                        'Receiving'
                                        ? 'Приход'
                                        : selectedDocument.type ===
                                            'Issue'
                                            ? 'Расход'
                                            : selectedDocument.type
                                }
                            />

                            <InfoCard
                                label="Статус"
                                value={
                                    getStatusLabel(
                                        selectedDocument.status,
                                    )
                                }
                            />

                            <InfoCard
                                label="Создан"
                                value={`${formatDate(
                                    selectedDocument.createdAtUtc,
                                )} ${formatTime(
                                    selectedDocument.createdAtUtc,
                                )}`}
                            />

                            <InfoCard
                                label="Проведён"
                                value={
                                    selectedDocument.postedAtUtc
                                        ? `${formatDate(
                                            selectedDocument.postedAtUtc,
                                        )} ${formatTime(
                                            selectedDocument.postedAtUtc,
                                        )}`
                                        : '—'
                                }
                            />

                            <InfoCard
                                label="Поставщик"
                                value={
                                    selectedDocument.supplier ||
                                    '—'
                                }
                            />

                            <InfoCard
                                label="Накладная"
                                value={
                                    selectedDocument.externalNumber ||
                                    '—'
                                }
                            />
                        </div>

                        {selectedDocument.comment && (
                            <div
                                style={
                                    styles.commentBox
                                }
                            >
                                <span
                                    style={
                                        styles.smallText
                                    }
                                >
                                    Комментарий
                                </span>

                                <div>
                                    {
                                        selectedDocument.comment
                                    }
                                </div>
                            </div>
                        )}

                        <div
                            style={
                                styles.itemsHeader
                            }
                        >
                            <div>
                                <p className="eyebrow">
                                    DOCUMENT
                                    ITEMS
                                </p>

                                <h3
                                    style={{
                                        margin:
                                            '3px 0 0',
                                    }}
                                >
                                    Состав документа
                                </h3>
                            </div>

                            <div
                                style={
                                    styles.itemsCounter
                                }
                            >
                                {
                                    selectedDocument
                                        .items
                                        .length
                                }{' '}
                                поз.
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>
                                            Материал
                                        </th>

                                        <th>
                                            Ширина
                                        </th>

                                        <th>
                                            Артикул
                                        </th>

                                        <th>
                                            Количество
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {selectedDocument.items.map(
                                        item => {
                                            const material =
                                                materialMap.get(
                                                    item.materialId,
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        item.id
                                                    }
                                                >
                                                    <td>
                                                        <DocumentMaterialCell
                                                            material={
                                                                material
                                                            }
                                                            fallbackId={
                                                                item.materialId
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        {material
                                                            ?.widthMeters
                                                            ? formatWidth(
                                                                material.widthMeters,
                                                            )
                                                            : '—'}
                                                    </td>

                                                    <td>
                                                        {material
                                                            ?.article ??
                                                            '—'}
                                                    </td>

                                                    <td>
                                                        <strong>
                                                            {numberFormatter.format(
                                                                item.quantity,
                                                            )}{' '}
                                                            {material?.kind ===
                                                                'Oracal641'
                                                                ? 'м'
                                                                : 'шт.'}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div
                            style={
                                styles.modalFooter
                            }
                        >
                            {selectedDocument.status ===
                                'Cancelled' && (
                                    <div
                                        style={
                                            styles.cancelledNotice
                                        }
                                    >
                                        <Ban
                                            size={
                                                17
                                            }
                                        />

                                        Документ
                                        отменён
                                        {selectedDocument.cancelledAtUtc
                                            ? ` ${formatDate(
                                                selectedDocument.cancelledAtUtc,
                                            )} ${formatTime(
                                                selectedDocument.cancelledAtUtc,
                                            )}`
                                            : ''}
                                    </div>
                                )}

                            <div
                                style={{
                                    flex:
                                        1,
                                }}
                            />

                            <button
                                type="button"
                                className="button secondary"
                                onClick={
                                    closeDocument
                                }
                            >
                                Закрыть
                            </button>

                            {selectedDocument.status ===
                                'Posted' && (
                                    <button
                                        type="button"
                                        style={
                                            styles.cancelButton
                                        }
                                        disabled={
                                            cancelling
                                        }
                                        onClick={() =>
                                            cancelDocument(
                                                selectedDocument,
                                            )
                                        }
                                    >
                                        <RotateCcw
                                            size={
                                                17
                                            }
                                        />

                                        {cancelling
                                            ? 'Отмена...'
                                            : 'Отменить документ'}
                                    </button>
                                )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}

function DocumentMaterialCell({
    material,
    fallbackId,
}: {
    material?:
    MaterialCatalogItem;

    fallbackId:
    string;
}) {
    if (!material) {
        return (
            <div>
                <strong>
                    Материал не найден
                </strong>

                <div
                    style={
                        styles.smallText
                    }
                >
                    {fallbackId}
                </div>
            </div>
        );
    }

    if (
        material.kind ===
        'Oracal641'
    ) {
        return (
            <div
                style={
                    styles.materialCell
                }
            >
                <div
                    style={{
                        ...styles.colorSwatch,

                        background:
                            material.colorHex ??
                            '#777777',
                    }}
                />

                <div>
                    <strong>
                        ORACAL 641{' '}
                        {
                            material.colorCode
                        }{' '}
                        {
                            material.colorName
                        }
                    </strong>

                    <div
                        style={
                            styles.smallText
                        }
                    >
                        {
                            material.article
                        }
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <strong>
                {normalizeMaterialName(
                    material.name,
                )}
            </strong>

            <div
                style={
                    styles.smallText
                }
            >
                {
                    material.article
                }
            </div>
        </div>
    );
}

function DocumentTypeBadge({
    type,
}: {
    type:
    string;
}) {
    if (
        type ===
        'Receiving'
    ) {
        return (
            <span
                style={
                    styles.receivingBadge
                }
            >
                <ArrowDownToLine
                    size={
                        14
                    }
                />

                Приход
            </span>
        );
    }

    if (
        type ===
        'Issue'
    ) {
        return (
            <span
                style={
                    styles.issueBadge
                }
            >
                <ArrowUpFromLine
                    size={
                        14
                    }
                />

                Расход
            </span>
        );
    }

    return (
        <span>
            {type}
        </span>
    );
}

function DocumentStatusBadge({
    status,
}: {
    status:
    string;
}) {
    if (
        status ===
        'Posted'
    ) {
        return (
            <span
                style={
                    styles.postedBadge
                }
            >
                Проведён
            </span>
        );
    }

    if (
        status ===
        'Cancelled'
    ) {
        return (
            <span
                style={
                    styles.cancelledBadge
                }
            >
                Отменён
            </span>
        );
    }

    return (
        <span
            style={
                styles.draftBadge
            }
        >
            Черновик
        </span>
    );
}

function DocumentStat({
    icon,
    value,
    label,
}: {
    icon:
    React.ReactNode;

    value:
    number;

    label:
    string;
}) {
    return (
        <article className="stat-card">
            <div className="stat-icon">
                {icon}
            </div>

            <div>
                <div className="stat-label">
                    {label}
                </div>

                <div className="stat-value">
                    {value}
                </div>
            </div>
        </article>
    );
}

function InfoCard({
    label,
    value,
}: {
    label:
    string;

    value:
    string;
}) {
    return (
        <div
            style={
                styles.infoCard
            }
        >
            <span
                style={
                    styles.infoLabel
                }
            >
                {label}
            </span>

            <strong>
                {value}
            </strong>
        </div>
    );
}

function getStatusLabel(
    status: string,
) {
    switch (
    status
    ) {
        case 'Posted':
            return 'Проведён';

        case 'Cancelled':
            return 'Отменён';

        case 'Draft':
            return 'Черновик';

        default:
            return status;
    }
}

function formatDate(
    value: string,
) {
    return new Intl.DateTimeFormat(
        'ru-RU',
        {
            day:
                '2-digit',

            month:
                '2-digit',

            year:
                'numeric',
        },
    ).format(
        new Date(
            value,
        ),
    );
}

function formatTime(
    value: string,
) {
    return new Intl.DateTimeFormat(
        'ru-RU',
        {
            hour:
                '2-digit',

            minute:
                '2-digit',
        },
    ).format(
        new Date(
            value,
        ),
    );
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

const styles: Record<
    string,
    CSSProperties
> = {
    toolbar: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            10,

        padding:
            16,

        flexWrap:
            'wrap',
    },

    searchBox: {
        flex:
            '1 1 320px',

        minHeight:
            42,

        display:
            'flex',

        alignItems:
            'center',

        gap:
            9,

        padding:
            '0 12px',

        border:
            '1px solid #293542',

        borderRadius:
            10,

        background:
            '#111922',
    },

    searchInput: {
        flex:
            1,

        minWidth:
            0,

        border:
            0,

        outline:
            0,

        background:
            'transparent',

        color:
            '#fff',
    },

    select: {
        minHeight:
            42,

        padding:
            '0 12px',

        border:
            '1px solid #293542',

        borderRadius:
            10,

        background:
            '#111922',

        color:
            '#fff',
    },

    documentNumberCell: {
        display:
            'grid',

        gap:
            3,
    },

    supplierCell: {
        display:
            'grid',

        gap:
            3,
    },

    supplierCellSpan: {
        color:
            '#77879a',
    },

    dateCell: {
        display:
            'grid',

        gap:
            2,
    },

    smallText: {
        color:
            '#718096',

        fontSize:
            10,

        fontWeight:
            400,

        overflowWrap:
            'anywhere',
    },

    receivingBadge: {
        display:
            'inline-flex',

        alignItems:
            'center',

        gap:
            5,

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(34,197,94,.10)',

        color:
            '#86efac',

        border:
            '1px solid rgba(34,197,94,.18)',

        fontSize:
            11,

        fontWeight:
            700,
    },

    issueBadge: {
        display:
            'inline-flex',

        alignItems:
            'center',

        gap:
            5,

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(249,115,22,.10)',

        color:
            '#fdba74',

        border:
            '1px solid rgba(249,115,22,.18)',

        fontSize:
            11,

        fontWeight:
            700,
    },

    postedBadge: {
        display:
            'inline-flex',

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(59,130,246,.10)',

        color:
            '#93c5fd',

        border:
            '1px solid rgba(59,130,246,.18)',

        fontSize:
            11,

        fontWeight:
            700,
    },

    cancelledBadge: {
        display:
            'inline-flex',

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(239,68,68,.10)',

        color:
            '#fca5a5',

        border:
            '1px solid rgba(239,68,68,.18)',

        fontSize:
            11,

        fontWeight:
            700,
    },

    draftBadge: {
        display:
            'inline-flex',

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(245,158,11,.10)',

        color:
            '#fbbf24',

        border:
            '1px solid rgba(245,158,11,.18)',

        fontSize:
            11,

        fontWeight:
            700,
    },

    iconButton: {
        width:
            36,

        height:
            36,

        display:
            'grid',

        placeItems:
            'center',

        border:
            '1px solid #293542',

        borderRadius:
            9,

        background:
            '#141d27',

        color:
            '#b9c5d2',

        cursor:
            'pointer',
    },

    tableFooter: {
        padding:
            '12px 16px',

        borderTop:
            '1px solid rgba(255,255,255,.05)',

        color:
            '#718096',

        fontSize:
            11,
    },

    overlay: {
        position:
            'fixed',

        inset:
            0,

        zIndex:
            1000,

        display:
            'grid',

        placeItems:
            'center',

        padding:
            20,

        background:
            'rgba(0,0,0,.75)',

        backdropFilter:
            'blur(7px)',
    },

    modal: {
        width:
            'min(900px, 96vw)',

        maxHeight:
            '92vh',

        overflowY:
            'auto',

        border:
            '1px solid #273446',

        borderRadius:
            20,

        background:
            '#111a2a',

        boxShadow:
            '0 30px 100px rgba(0,0,0,.55)',
    },

    modalHeader: {
        display:
            'flex',

        justifyContent:
            'space-between',

        alignItems:
            'center',

        gap:
            16,

        padding:
            22,

        borderBottom:
            '1px solid rgba(255,255,255,.06)',
    },

    closeButton: {
        width:
            40,

        height:
            40,

        display:
            'grid',

        placeItems:
            'center',

        border:
            0,

        borderRadius:
            10,

        background:
            'rgba(255,255,255,.06)',

        color:
            '#fff',

        cursor:
            'pointer',
    },

    documentInfoGrid: {
        display:
            'grid',

        gridTemplateColumns:
            'repeat(3, minmax(0, 1fr))',

        gap:
            10,

        padding:
            18,
    },

    infoCard: {
        display:
            'grid',

        gap:
            5,

        padding:
            12,

        border:
            '1px solid #293542',

        borderRadius:
            10,

        background:
            '#141d27',
    },

    infoLabel: {
        color:
            '#718096',

        fontSize:
            10,
    },

    commentBox: {
        display:
            'grid',

        gap:
            6,

        margin:
            '0 18px 18px',

        padding:
            12,

        border:
            '1px solid #293542',

        borderRadius:
            10,

        background:
            '#101820',
    },

    itemsHeader: {
        display:
            'flex',

        justifyContent:
            'space-between',

        alignItems:
            'center',

        gap:
            16,

        padding:
            '18px 18px 12px',
    },

    itemsCounter: {
        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(59,130,246,.10)',

        color:
            '#93c5fd',

        fontSize:
            11,

        fontWeight:
            700,
    },

    materialCell: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            10,
    },

    colorSwatch: {
        width:
            27,

        height:
            27,

        borderRadius:
            6,

        flex:
            '0 0 auto',

        border:
            '1px solid rgba(255,255,255,.22)',
    },

    modalFooter: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            10,

        padding:
            18,

        borderTop:
            '1px solid rgba(255,255,255,.06)',
    },

    cancelButton: {
        minHeight:
            40,

        display:
            'inline-flex',

        alignItems:
            'center',

        justifyContent:
            'center',

        gap:
            7,

        padding:
            '0 14px',

        border:
            '1px solid rgba(239,68,68,.28)',

        borderRadius:
            9,

        background:
            'rgba(239,68,68,.10)',

        color:
            '#fca5a5',

        cursor:
            'pointer',

        fontWeight:
            700,
    },

    cancelledNotice: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            7,

        color:
            '#fca5a5',

        fontSize:
            12,

        fontWeight:
            700,
    },

    errorBox: {
        padding:
            '12px 14px',

        marginBottom:
            16,

        border:
            '1px solid rgba(239,68,68,.25)',

        borderRadius:
            10,

        background:
            'rgba(127,29,29,.18)',

        color:
            '#fca5a5',
    },

    successBox: {
        padding:
            '12px 14px',

        marginBottom:
            16,

        border:
            '1px solid rgba(34,197,94,.25)',

        borderRadius:
            10,

        background:
            'rgba(20,83,45,.18)',

        color:
            '#86efac',
    },
};
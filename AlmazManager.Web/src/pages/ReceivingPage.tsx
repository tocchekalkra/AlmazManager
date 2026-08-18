import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    ArrowDownToLine,
    CheckCircle2,
    Package,
    Palette,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
} from 'lucide-react';

import api from '../api/api';
import { loadAllMaterialCatalogItems } from '../api/catalog';
import { filmMarkerText } from '../utils/material';

type MaterialCatalogItem = {
    id: string;
    name: string;
    article: string;
    categoryId: string;
    categoryName: string;
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

type Category = {
    id: string;
    name: string;
    isActive: boolean;
};

type ReceivingLine = {
    materialId: string;

    name: string;
    article: string;
    categoryName: string;

    kind: string;
    unit: string;

    widthMeters?: number | null;

    colorCode?: string | null;
    colorName?: string | null;
    colorHex?: string | null;

    quantity: number;
};

type WarehouseDocumentResponse = {
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

    items: {
        id: string;
        materialId: string;
        quantity: number;
    }[];
};

type StandardGroup = {
    key: string;
    name: string;
    categoryId: string;
    categoryName: string;
    materials: MaterialCatalogItem[];
};

type OracalGroup = {
    code: string;
    name: string;
    hex: string;
    materials: MaterialCatalogItem[];
};

const numberFormatter =
    new Intl.NumberFormat(
        'ru-RU',
        {
            maximumFractionDigits: 2,
        },
    );

export default function ReceivingPage() {
    const [materials, setMaterials] =
        useState<MaterialCatalogItem[]>([]);

    const [categories, setCategories] =
        useState<Category[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [supplier, setSupplier] =
        useState('');

    const [
        externalNumber,
        setExternalNumber,
    ] = useState('');

    const [documentDate, setDocumentDate] =
        useState(() => new Date().toISOString().slice(0, 10));

    const [comment, setComment] =
        useState('');

    const [
        materialMode,
        setMaterialMode,
    ] =
        useState<
            'standard' | 'oracal'
        >('standard');

    const [
        selectedGroupName,
        setSelectedGroupName,
    ] = useState('');

    const [
        selectedMaterialId,
        setSelectedMaterialId,
    ] = useState('');

    const [
        selectedOracalCode,
        setSelectedOracalCode,
    ] = useState('');

    const [
        quantity,
        setQuantity,
    ] = useState('1');

    const [lines, setLines] =
        useState<ReceivingLine[]>([]);

    const [search, setSearch] =
        useState('');

    useEffect(() => {
        loadMaterials();
    }, []);

    async function loadMaterials() {
        try {
            setLoading(true);
            setError('');

            const [items, categoryResponse] =
                await Promise.all([
                    loadAllMaterialCatalogItems<MaterialCatalogItem>(),
                    api.get<Category[]>('/categories'),
                ]);

            setMaterials(
                items
                    .filter(
                        material =>
                            material.isActive,
                    ) ?? [],
            );
            setCategories(categoryResponse.data ?? []);
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка загрузки материалов:',
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

    const standardMaterials =
        useMemo(
            () =>
                materials.filter(
                    material =>
                        material.kind !==
                        'Oracal641',
                ),
            [materials],
        );

    const oracalMaterials =
        useMemo(
            () =>
                materials.filter(
                    material =>
                        material.kind ===
                        'Oracal641',
                ),
            [materials],
        );

    const standardGroups =
        useMemo(() => {
            const categoryMap = new Map(
                categories.map(category => [category.id, category.name]),
            );
            const map =
                new Map<
                    string,
                    StandardGroup
                >();

            for (
                const material of
                standardMaterials
            ) {
                const groupName =
                    normalizeMaterialGroupName(
                        material.name,
                    );

                const key =
                    `${material.categoryId}::${groupName.toLowerCase()}`;

                const group =
                    map.get(key) ?? {
                        key,
                        name:
                            groupName,

                        categoryId:
                            material.categoryId,

                        categoryName:
                            categoryMap.get(material.categoryId) ?? 'Без категории',

                        materials:
                            [],
                    };

                group.materials.push(
                    material,
                );

                map.set(
                    key,
                    group,
                );
            }

            return Array.from(
                map.values(),
            )
                .map(group => ({
                    ...group,

                    materials:
                        group.materials
                            .slice()
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
                                    Number(
                                        b.widthMeters ??
                                        0,
                                    ) -
                                    Number(
                                        a.widthMeters ??
                                        0,
                                    ),
                            ),
                }));
        }, [
            standardMaterials,
            categories,
        ]);

    const standardGroupsByCategory = useMemo(() => {
        const map = new Map<string, { id: string; name: string; groups: StandardGroup[] }>();
        for (const group of standardGroups) {
            const category = map.get(group.categoryId) ?? {
                id: group.categoryId,
                name: group.categoryName,
                groups: [],
            };
            category.groups.push(group);
            map.set(group.categoryId, category);
        }
        return [...map.values()];
    }, [standardGroups]);

    const oracalGroups =
        useMemo(() => {
            const map =
                new Map<
                    string,
                    OracalGroup
                >();

            for (
                const material of
                oracalMaterials
            ) {
                const code =
                    material.colorCode ??
                    '—';

                const key =
                    code.toLowerCase();

                const group =
                    map.get(key) ?? {
                        code,

                        name:
                            material.colorName ??
                            material.name,

                        hex:
                            material.colorHex ??
                            '#777777',

                        materials:
                            [],
                    };

                group.materials.push(
                    material,
                );

                map.set(
                    key,
                    group,
                );
            }

            return Array.from(
                map.values(),
            )
                .map(group => ({
                    ...group,

                    materials:
                        group.materials
                            .slice()
                            .sort(
                                (
                                    a,
                                    b,
                                ) =>
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
                        a.code.localeCompare(
                            b.code,
                            'ru',
                            {
                                numeric:
                                    true,
                            },
                        ),
                );
        }, [
            oracalMaterials,
        ]);

    const selectedStandardGroup =
        standardGroups.find(
            group =>
                group.key ===
                selectedGroupName,
        );

    const selectedOracalGroup =
        oracalGroups.find(
            group =>
                group.code ===
                selectedOracalCode,
        );

    const selectedMaterial =
        materials.find(
            material =>
                material.id ===
                selectedMaterialId,
        );

    const filteredLines =
        useMemo(() => {
            const normalized =
                search
                    .trim()
                    .toLowerCase();

            if (!normalized) {
                return lines;
            }

            return lines.filter(
                line =>
                    line.name
                        .toLowerCase()
                        .includes(
                            normalized,
                        ) ||
                    line.article
                        .toLowerCase()
                        .includes(
                            normalized,
                        ) ||
                    (
                        line.colorName ??
                        ''
                    )
                        .toLowerCase()
                        .includes(
                            normalized,
                        ) ||
                    (
                        line.colorCode ??
                        ''
                    )
                        .toLowerCase()
                        .includes(
                            normalized,
                        ),
            );
        }, [
            lines,
            search,
        ]);

    const totalStandardPieces =
        lines
            .filter(
                line =>
                    line.kind !==
                    'Oracal641',
            )
            .reduce(
                (
                    sum,
                    line,
                ) =>
                    sum +
                    line.quantity,
                0,
            );

    const totalOracalMeters =
        lines
            .filter(
                line =>
                    line.kind ===
                    'Oracal641',
            )
            .reduce(
                (
                    sum,
                    line,
                ) =>
                    sum +
                    line.quantity,
                0,
            );

    function switchMode(
        mode:
            | 'standard'
            | 'oracal',
    ) {
        setMaterialMode(
            mode,
        );

        setSelectedGroupName(
            '',
        );

        setSelectedOracalCode(
            '',
        );

        setSelectedMaterialId(
            '',
        );

        setQuantity(
            mode ===
                'standard'
                ? '1'
                : '1',
        );

        setError('');
    }

    function selectStandardGroup(
        groupKey: string,
    ) {
        setSelectedGroupName(
            groupKey,
        );

        const group =
            standardGroups.find(
                item =>
                    item.key ===
                    groupKey,
            );

        setSelectedMaterialId(
            group?.materials[0]
                ?.id ?? '',
        );
    }

    function selectOracalColor(
        code: string,
    ) {
        setSelectedOracalCode(
            code,
        );

        const group =
            oracalGroups.find(
                item =>
                    item.code ===
                    code,
            );

        setSelectedMaterialId(
            group?.materials[0]
                ?.id ?? '',
        );
    }

    function addLine() {
        if (
            !selectedMaterial
        ) {
            setError(
                'Выберите материал.',
            );

            return;
        }

        let parsedQuantity =
            Number(
                quantity.replace(
                    ',',
                    '.',
                ),
            );

        if (
            Number.isNaN(
                parsedQuantity,
            ) ||
            parsedQuantity <= 0
        ) {
            setError(
                'Количество должно быть больше нуля.',
            );

            return;
        }

        if (selectedMaterial.kind === 'Oracal641') {
            parsedQuantity = Math.round(parsedQuantity * 100) / 100;
        }

        if (
            selectedMaterial.kind !==
            'Oracal641' &&
            !Number.isInteger(
                parsedQuantity,
            )
        ) {
            setError(
                'Обычные материалы учитываются целыми штуками.',
            );

            return;
        }

        setLines(
            current => {
                const existing =
                    current.find(
                        line =>
                            line.materialId ===
                            selectedMaterial.id,
                    );

                if (existing) {
                    return current.map(
                        line =>
                            line.materialId ===
                                selectedMaterial.id
                                ? {
                                    ...line,

                                    quantity:
                                        line.quantity +
                                        parsedQuantity,
                                }
                                : line,
                    );
                }

                return [
                    ...current,

                    {
                        materialId:
                            selectedMaterial.id,

                        name:
                            selectedMaterial.kind ===
                                'Oracal641'
                                ? `ORACAL 641 ${selectedMaterial.colorCode ?? ''} ${selectedMaterial.colorName ?? ''}`
                                : normalizeMaterialGroupName(
                                    selectedMaterial.name,
                                ),

                        article:
                            selectedMaterial.article,

                        categoryName:
                            selectedMaterial.categoryName,

                        kind:
                            selectedMaterial.kind,

                        unit:
                            selectedMaterial.unit,

                        widthMeters:
                            selectedMaterial.widthMeters,

                        colorCode:
                            selectedMaterial.colorCode,

                        colorName:
                            selectedMaterial.colorName,

                        colorHex:
                            selectedMaterial.colorHex,

                        quantity:
                            parsedQuantity,
                    },
                ];
            },
        );

        setQuantity(
            selectedMaterial.kind ===
                'Oracal641'
                ? '1'
                : '1',
        );

        setError('');
    }

    function removeLine(
        materialId: string,
    ) {
        setLines(
            current =>
                current.filter(
                    line =>
                        line.materialId !==
                        materialId,
                ),
        );
    }

    function updateLineQuantity(
        materialId: string,
        value: string,
    ) {
        const parsed =
            Number(
                value.replace(
                    ',',
                    '.',
                ),
            );

        if (
            Number.isNaN(
                parsed,
            )
        ) {
            return;
        }

        setLines(
            current =>
                current.map(
                    line =>
                        line.materialId ===
                            materialId
                                ? {
                                    ...line,
                                    quantity:
                                        line.kind === 'Oracal641'
                                            ? Math.round(parsed * 100) / 100
                                            : Math.round(parsed),
                                }
                            : line,
                ),
        );
    }

    async function postReceiving() {
        if (
            lines.length === 0
        ) {
            setError(
                'Добавьте хотя бы одну позицию.',
            );

            return;
        }

        for (
            const line of
            lines
        ) {
            if (
                line.quantity <=
                0
            ) {
                setError(
                    `У позиции «${line.name}» количество должно быть больше нуля.`,
                );

                return;
            }

            if (
                line.kind !==
                'Oracal641' &&
                !Number.isInteger(
                    line.quantity,
                )
            ) {
                setError(
                    `Позиция «${line.name}» должна иметь целое количество штук.`,
                );

                return;
            }
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            /*
             * 1. Создаём черновик.
             */
            const createResponse =
                await api.post<WarehouseDocumentResponse>(
                    '/documents',
                    {
                        type:
                            'Receiving',

                        documentDate,

                        supplyInvoiceId: null,

                        supplier:
                            supplier.trim() ||
                            null,

                        externalNumber:
                            externalNumber.trim() ||
                            null,

                        recipient: null,

                        comment:
                            comment.trim() ||
                            null,

                        items:
                            lines.map(
                                line => ({
                                    materialId:
                                        line.materialId,

                                    quantity:
                                        line.quantity,
                                }),
                            ),
                    },
                );

            const document =
                createResponse.data;

            /*
             * 2. Сразу проводим документ.
             */
            const postResponse =
                await api.post<WarehouseDocumentResponse>(
                    `/documents/${document.id}/post`,
                );

            setSuccess(
                `Приход ${postResponse.data.number} успешно проведён.`,
            );

            setSupplier('');
            setExternalNumber('');
            setDocumentDate(new Date().toISOString().slice(0, 10));
            setComment('');
            setLines([]);
            setSearch('');

            setSelectedGroupName('');
            setSelectedOracalCode('');
            setSelectedMaterialId('');
            setQuantity('1');

            await loadMaterials();
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка проведения прихода:',
                requestError,
            );

            setError(
                requestError?.response?.data
                    ?.message ??
                requestError?.response?.data
                    ?.title ??
                'Не удалось провести приход.',
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
                        Приход
                    </h1>

                    <p>
                        Приём материалов на склад
                        с автоматическим изменением
                        остатков и записью в журнал.
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

                    Обновить материалы
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
                        size={19}
                    />

                    {success}
                </div>
            )}

            <section className="panel">
                <div
                    style={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <p className="eyebrow">
                            DOCUMENT
                        </p>

                        <h2>
                            Данные прихода
                        </h2>
                    </div>
                </div>

                <div
                    style={
                        styles.documentGrid
                    }
                >
                    <label
                        style={
                            styles.field
                        }
                    >
                        <span>
                            Поставщик
                        </span>

                        <input
                            value={
                                supplier
                            }
                            onChange={event =>
                                setSupplier(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Например: ООО Поставщик"
                            style={
                                styles.input
                            }
                        />
                    </label>

                    <label
                        style={
                            styles.field
                        }
                    >
                        <span>
                            Номер накладной
                        </span>

                        <input
                            value={
                                externalNumber
                            }
                            onChange={event =>
                                setExternalNumber(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Например: 4587"
                            style={
                                styles.input
                            }
                        />
                    </label>

                    <label style={styles.field}>
                        <span>Дата накладной</span>
                        <input
                            type="date"
                            value={documentDate}
                            onChange={event => setDocumentDate(event.target.value)}
                            style={styles.input}
                        />
                    </label>

                    <label
                        style={{
                            ...styles.field,
                            gridColumn:
                                '1 / -1',
                        }}
                    >
                        <span>
                            Комментарий
                        </span>

                        <textarea
                            value={
                                comment
                            }
                            onChange={event =>
                                setComment(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Дополнительная информация о поставке..."
                            style={
                                styles.textarea
                            }
                        />
                    </label>
                </div>
            </section>

            <section
                className="panel"
                style={{
                    marginTop:
                        18,
                }}
            >
                <div
                    style={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <p className="eyebrow">
                            ADD MATERIAL
                        </p>

                        <h2>
                            Добавить позицию
                        </h2>
                    </div>
                </div>

                <div
                    style={
                        styles.modeSelector
                    }
                >
                    <button
                        type="button"
                        style={{
                            ...styles.modeButton,

                            ...(materialMode ===
                                'standard'
                                ? styles.modeButtonActive
                                : {}),
                        }}
                        onClick={() =>
                            switchMode(
                                'standard',
                            )
                        }
                    >
                        <Package
                            size={18}
                        />

                        Обычные материалы
                    </button>

                    <button
                        type="button"
                        style={{
                            ...styles.modeButton,

                            ...(materialMode ===
                                'oracal'
                                ? styles.modeButtonActive
                                : {}),
                        }}
                        onClick={() =>
                            switchMode(
                                'oracal',
                            )
                        }
                    >
                        <Palette
                            size={18}
                        />

                        ORACAL 641
                    </button>
                </div>

                {loading ? (
                    <div
                        style={
                            styles.emptyState
                        }
                    >
                        Загрузка материалов...
                    </div>
                ) : (
                    <div
                        style={
                            styles.materialSelector
                        }
                    >
                        {materialMode ===
                            'standard' ? (
                            <>
                                <label
                                    style={
                                        styles.field
                                    }
                                >
                                    <span>
                                        Материал
                                    </span>

                                    <select
                                        value={
                                            selectedGroupName
                                        }
                                        onChange={event =>
                                            selectStandardGroup(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                    >
                                        <option value="">
                                            Выберите материал
                                        </option>

                                        {standardGroupsByCategory.map(category => (
                                            <optgroup key={category.id} label={category.name}>
                                                {category.groups.map(group => (
                                                    <option key={group.key} value={group.key}>
                                                        {group.name}
                                                    </option>
                                                ))}
                                            </optgroup>
                                        ))}
                                    </select>
                                </label>

                                <label
                                    style={
                                        styles.field
                                    }
                                >
                                    <span>
                                        Ширина
                                    </span>

                                    <select
                                        value={
                                            selectedMaterialId
                                        }
                                        onChange={event =>
                                            setSelectedMaterialId(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            !selectedStandardGroup
                                        }
                                        style={
                                            styles.input
                                        }
                                    >
                                        {!selectedStandardGroup && (
                                            <option value="">
                                                Сначала выберите материал
                                            </option>
                                        )}

                                        {selectedStandardGroup
                                            ?.materials
                                            .map(
                                                material => (
                                                    <option
                                                        key={
                                                            material.id
                                                        }
                                                        value={
                                                            material.id
                                                        }
                                                    >
                                                        {material.widthMeters
                                                            ? formatWidth(
                                                                material.widthMeters,
                                                            )
                                                            : 'Без ширины'}{' '}
                                                        {filmMarkerText(material.categoryName)
                                                            ? `· ${filmMarkerText(material.categoryName)} `
                                                            : ''}
                                                        · остаток{' '}
                                                        {numberFormatter.format(
                                                            material.currentQuantity,
                                                        )}{' '}
                                                        шт.
                                                    </option>
                                                ),
                                            )}
                                    </select>
                                </label>
                            </>
                        ) : (
                            <>
                                <label
                                    style={
                                        styles.field
                                    }
                                >
                                    <span>
                                        Цвет
                                    </span>

                                    <select
                                        value={
                                            selectedOracalCode
                                        }
                                        onChange={event =>
                                            selectOracalColor(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                    >
                                        <option value="">
                                            Выберите цвет
                                        </option>

                                        {oracalGroups.map(
                                            group => (
                                                <option
                                                    key={
                                                        group.code
                                                    }
                                                    value={
                                                        group.code
                                                    }
                                                >
                                                    {
                                                        group.code
                                                    }{' '}
                                                    —{' '}
                                                    {
                                                        group.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </label>

                                <label
                                    style={
                                        styles.field
                                    }
                                >
                                    <span>
                                        Ширина
                                    </span>

                                    <select
                                        value={
                                            selectedMaterialId
                                        }
                                        onChange={event =>
                                            setSelectedMaterialId(
                                                event
                                                    .target
                                                    .value,
                                            )
                                        }
                                        disabled={
                                            !selectedOracalGroup
                                        }
                                        style={
                                            styles.input
                                        }
                                    >
                                        {!selectedOracalGroup && (
                                            <option value="">
                                                Сначала выберите цвет
                                            </option>
                                        )}

                                        {selectedOracalGroup
                                            ?.materials
                                            .map(
                                                material => (
                                                    <option
                                                        key={
                                                            material.id
                                                        }
                                                        value={
                                                            material.id
                                                        }
                                                    >
                                                        {material.widthMeters
                                                            ? formatWidth(
                                                                material.widthMeters,
                                                            )
                                                            : '—'}{' '}
                                                        · остаток{' '}
                                                        {numberFormatter.format(
                                                            material.currentQuantity,
                                                        )}{' '}
                                                        м
                                                    </option>
                                                ),
                                            )}
                                    </select>
                                </label>
                            </>
                        )}

                        <label
                            style={
                                styles.field
                            }
                        >
                            <span>
                                Количество
                            </span>

                            <div
                                style={
                                    styles.quantityInputWrap
                                }
                            >
                                <input
                                    type="number"
                                    min={materialMode === 'oracal' ? '0.01' : '1'}
                                    step={materialMode === 'oracal' ? '0.01' : '1'}
                                    value={
                                        quantity
                                    }
                                    onChange={event =>
                                        setQuantity(
                                            event
                                                .target
                                                .value,
                                        )
                                    }
                                    placeholder={
                                        materialMode ===
                                            'oracal'
                                            ? 'Например: 25,5'
                                            : 'Например: 5'
                                    }
                                    style={
                                        styles.input
                                    }
                                />

                                <span
                                    style={
                                        styles.unitBadge
                                    }
                                >
                                    {materialMode ===
                                        'oracal'
                                        ? 'м'
                                        : 'шт.'}
                                </span>
                            </div>
                        </label>

                        <button
                            type="button"
                            className="button primary"
                            onClick={
                                addLine
                            }
                            style={{
                                alignSelf:
                                    'end',
                                minHeight:
                                    44,
                            }}
                        >
                            <Plus
                                size={17}
                            />

                            Добавить
                        </button>
                    </div>
                )}

                {materialMode ===
                    'oracal' &&
                    selectedOracalGroup && (
                        <div
                            style={
                                styles.oracalPreview
                            }
                        >
                            <div
                                style={{
                                    ...styles.colorSwatch,

                                    background:
                                        selectedOracalGroup.hex,
                                }}
                            />

                            <div>
                                <strong>
                                    {
                                        selectedOracalGroup.code
                                    }{' '}
                                    {
                                        selectedOracalGroup.name
                                    }
                                </strong>

                                <div
                                    style={
                                        styles.helper
                                    }
                                >
                                    ORACAL 641
                                </div>
                            </div>
                        </div>
                    )}
            </section>

            <section
                className="panel"
                style={{
                    marginTop:
                        18,
                }}
            >
                <div
                    style={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <p className="eyebrow">
                            DOCUMENT ITEMS
                        </p>

                        <h2>
                            Позиции прихода
                        </h2>

                        <p
                            style={
                                styles.helper
                            }
                        >
                            Позиций:{' '}
                            {
                                lines.length
                            }
                            {' · '}
                            Обычные:{' '}
                            {numberFormatter.format(
                                totalStandardPieces,
                            )}{' '}
                            шт.
                            {' · '}
                            ORACAL:{' '}
                            {numberFormatter.format(
                                totalOracalMeters,
                            )}{' '}
                            м
                        </p>
                    </div>

                    <div
                        style={
                            styles.searchBox
                        }
                    >
                        <Search
                            size={16}
                        />

                        <input
                            value={
                                search
                            }
                            onChange={event =>
                                setSearch(
                                    event
                                        .target
                                        .value,
                                )
                            }
                            placeholder="Поиск в документе..."
                            style={
                                styles.searchInput
                            }
                        />
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

                                <th />
                            </tr>
                        </thead>

                        <tbody>
                            {filteredLines.map(
                                line => (
                                    <tr
                                        key={
                                            line.materialId
                                        }
                                    >
                                        <td>
                                            <div
                                                style={
                                                    styles.materialNameCell
                                                }
                                            >
                                                {line.kind ===
                                                    'Oracal641' && (
                                                        <div
                                                            style={{
                                                                ...styles.smallColorSwatch,

                                                                background:
                                                                    line.colorHex ??
                                                                    '#777',
                                                            }}
                                                        />
                                                    )}

                                                <div>
                                                    <strong>
                                                        {
                                                            line.name
                                                        }
                                                    </strong>

                                                    {line.kind ===
                                                        'Oracal641' && (
                                                            <div
                                                                style={
                                                                    styles.helper
                                                                }
                                                            >
                                                                {
                                                                    line.colorCode
                                                                }
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            {line.widthMeters
                                                ? formatWidth(
                                                    line.widthMeters,
                                                )
                                                : '—'}
                                            {filmMarkerText(line.categoryName)
                                                ? ` · ${filmMarkerText(line.categoryName)}`
                                                : ''}
                                        </td>

                                        <td>
                                            {
                                                line.article
                                            }
                                        </td>

                                        <td>
                                            <div
                                                style={
                                                    styles.lineQuantity
                                                }
                                            >
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step={
                                                        line.kind ===
                                                            'Oracal641'
                                                            ? '0.01'
                                                            : '1'
                                                    }
                                                    value={
                                                        line.quantity
                                                    }
                                                    onChange={event =>
                                                        updateLineQuantity(
                                                            line.materialId,
                                                            event
                                                                .target
                                                                .value,
                                                        )
                                                    }
                                                    style={
                                                        styles.quantityTableInput
                                                    }
                                                />

                                                <span>
                                                    {line.kind ===
                                                        'Oracal641'
                                                        ? 'м'
                                                        : 'шт.'}
                                                </span>
                                            </div>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                style={
                                                    styles.deleteButton
                                                }
                                                onClick={() =>
                                                    removeLine(
                                                        line.materialId,
                                                    )
                                                }
                                                title="Удалить позицию"
                                            >
                                                <Trash2
                                                    size={
                                                        16
                                                    }
                                                />
                                            </button>
                                        </td>
                                    </tr>
                                ),
                            )}

                            {lines.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                5
                                            }
                                        >
                                            В документ пока ничего не добавлено.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>

                <div
                    style={
                        styles.postBar
                    }
                >
                    <div>
                        <div
                            style={
                                styles.postTitle
                            }
                        >
                            Готово к проведению
                        </div>

                        <div
                            style={
                                styles.helper
                            }
                        >
                            После проведения остатки на складе изменятся.
                        </div>
                    </div>

                    <button
                        type="button"
                        className="button primary"
                        disabled={
                            saving ||
                            lines.length ===
                            0
                        }
                        onClick={
                            postReceiving
                        }
                    >
                        <ArrowDownToLine
                            size={18}
                        />

                        {saving
                            ? 'Проведение...'
                            : 'Провести приход'}
                    </button>
                </div>
            </section>
        </div>
    );
}

function normalizeMaterialGroupName(
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
    sectionHeader: {
        display:
            'flex',

        justifyContent:
            'space-between',

        alignItems:
            'center',

        gap:
            16,

        flexWrap:
            'wrap',

        padding:
            18,

        borderBottom:
            '1px solid rgba(255,255,255,.06)',
    },

    documentGrid: {
        display:
            'grid',

        gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',

        gap:
            16,

        padding:
            18,
    },

    field: {
        display:
            'grid',

        gap:
            7,

        color:
            '#e5eaf0',

        fontSize:
            13,

        fontWeight:
            700,
    },

    input: {
        width:
            '100%',

        minHeight:
            44,

        boxSizing:
            'border-box',

        border:
            '1px solid #303b4a',

        borderRadius:
            10,

        background:
            '#151e29',

        color:
            '#fff',

        padding:
            '9px 12px',

        outline:
            0,
    },

    textarea: {
        width:
            '100%',

        minHeight:
            90,

        resize:
            'vertical',

        boxSizing:
            'border-box',

        border:
            '1px solid #303b4a',

        borderRadius:
            10,

        background:
            '#151e29',

        color:
            '#fff',

        padding:
            12,

        outline:
            0,
    },

    modeSelector: {
        display:
            'grid',

        gridTemplateColumns:
            '1fr 1fr',

        gap:
            10,

        padding:
            '18px 18px 0',
    },

    modeButton: {
        display:
            'flex',

        justifyContent:
            'center',

        alignItems:
            'center',

        gap:
            8,

        minHeight:
            48,

        border:
            '1px solid #303b4a',

        borderRadius:
            10,

        background:
            '#121b25',

        color:
            '#8795a6',

        cursor:
            'pointer',

        fontWeight:
            700,
    },

    modeButtonActive: {
        border:
            '1px solid #3b82f6',

        color:
            '#dbeafe',

        background:
            'rgba(59,130,246,.12)',
    },

    materialSelector: {
        display:
            'grid',

        gridTemplateColumns:
            'minmax(200px, 1.4fr) minmax(170px, 1fr) minmax(140px, .8fr) auto',

        gap:
            12,

        padding:
            18,

        alignItems:
            'end',
    },

    quantityInputWrap: {
        position:
            'relative',
    },

    unitBadge: {
        position:
            'absolute',

        right:
            11,

        top:
            '50%',

        transform:
            'translateY(-50%)',

        color:
            '#77879a',

        fontSize:
            12,
    },

    oracalPreview: {
        margin:
            '0 18px 18px',

        display:
            'flex',

        alignItems:
            'center',

        gap:
            12,

        padding:
            12,

        border:
            '1px solid #293542',

        borderRadius:
            10,

        background:
            '#101820',
    },

    colorSwatch: {
        width:
            42,

        height:
            42,

        borderRadius:
            9,

        border:
            '1px solid rgba(255,255,255,.25)',
    },

    smallColorSwatch: {
        width:
            24,

        height:
            24,

        borderRadius:
            6,

        flex:
            '0 0 auto',

        border:
            '1px solid rgba(255,255,255,.22)',
    },

    materialNameCell: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            10,
    },

    lineQuantity: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            7,
    },

    quantityTableInput: {
        width:
            90,

        minHeight:
            34,

        border:
            '1px solid #303b4a',

        borderRadius:
            8,

        background:
            '#121a24',

        color:
            '#fff',

        padding:
            '5px 8px',
    },

    deleteButton: {
        width:
            34,

        height:
            34,

        display:
            'grid',

        placeItems:
            'center',

        border:
            '1px solid rgba(239,68,68,.2)',

        borderRadius:
            8,

        background:
            'rgba(239,68,68,.08)',

        color:
            '#fca5a5',

        cursor:
            'pointer',
    },

    postBar: {
        display:
            'flex',

        justifyContent:
            'space-between',

        alignItems:
            'center',

        gap:
            16,

        padding:
            18,

        borderTop:
            '1px solid rgba(255,255,255,.06)',
    },

    postTitle: {
        fontSize:
            14,

        fontWeight:
            800,
    },

    searchBox: {
        minWidth:
            240,

        display:
            'flex',

        alignItems:
            'center',

        gap:
            8,

        padding:
            '0 10px',

        border:
            '1px solid #303b4a',

        borderRadius:
            9,

        background:
            '#121a24',
    },

    searchInput: {
        flex:
            1,

        minHeight:
            36,

        border:
            0,

        outline:
            0,

        background:
            'transparent',

        color:
            '#fff',
    },

    helper: {
        color:
            '#77879a',

        fontSize:
            11,

        fontWeight:
            400,
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
        display:
            'flex',

        alignItems:
            'center',

        gap:
            9,

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

    emptyState: {
        padding:
            30,

        textAlign:
            'center',

        color:
            '#77879a',
    },
};

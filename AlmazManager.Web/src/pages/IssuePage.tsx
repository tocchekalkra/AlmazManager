import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
} from 'react';

import {
    ArrowUpFromLine,
    CheckCircle2,
    Minus,
    Package,
    Palette,
    Plus,
    RefreshCcw,
    Search,
    Trash2,
} from 'lucide-react';

import api from '../api/api';
import { loadAllMaterialCatalogItems } from '../api/catalog';

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

type IssueLine = {
    materialId: string;

    name: string;
    article: string;

    kind: string;

    widthMeters?: number | null;

    colorCode?: string | null;
    colorName?: string | null;
    colorHex?: string | null;

    currentQuantity: number;
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
};

type StandardGroup = {
    name: string;
    materials: MaterialCatalogItem[];
};

type OracalGroup = {
    code: string;
    name: string;
    hex: string;
    materials: MaterialCatalogItem[];
};

const numberFormatter =
    new Intl.NumberFormat('ru-RU', {
        maximumFractionDigits: 2,
    });

export default function IssuePage() {
    const [materials, setMaterials] =
        useState<MaterialCatalogItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [comment, setComment] =
        useState('');

    const [materialMode, setMaterialMode] =
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

    const [quantity, setQuantity] =
        useState('1');

    const [lines, setLines] =
        useState<IssueLine[]>([]);

    const [search, setSearch] =
        useState('');

    useEffect(() => {
        loadMaterials();
    }, []);

    async function loadMaterials() {
        try {
            setLoading(true);
            setError('');

            const items =
                await loadAllMaterialCatalogItems<MaterialCatalogItem>();

            setMaterials(
                items.filter(
                    material =>
                        material.isActive,
                ),
            );
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
            const map =
                new Map<
                    string,
                    StandardGroup
                >();

            for (
                const material of
                standardMaterials
            ) {
                const name =
                    normalizeMaterialGroupName(
                        material.name,
                    );

                const key =
                    name.toLowerCase();

                const group =
                    map.get(key) ?? {
                        name,
                        materials: [],
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
        }, [standardMaterials]);

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
                                (a, b) =>
                                    Number(
                                        a.widthMeters ??
                                        0,
                                    ) -
                                    Number(
                                        b.widthMeters ??
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
                                numeric: true,
                            },
                        ),
                );
        }, [oracalMaterials]);

    const selectedStandardGroup =
        standardGroups.find(
            group =>
                group.name ===
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
                        line.colorCode ??
                        ''
                    )
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
                        ),
            );
        }, [lines, search]);

    const totalPieces =
        lines
            .filter(
                line =>
                    line.kind !==
                    'Oracal641',
            )
            .reduce(
                (sum, line) =>
                    sum +
                    line.quantity,
                0,
            );

    const totalMeters =
        lines
            .filter(
                line =>
                    line.kind ===
                    'Oracal641',
            )
            .reduce(
                (sum, line) =>
                    sum +
                    line.quantity,
                0,
            );

    function switchMode(
        mode:
            | 'standard'
            | 'oracal',
    ) {
        setMaterialMode(mode);

        setSelectedGroupName('');
        setSelectedOracalCode('');
        setSelectedMaterialId('');
        setQuantity('1');
        setError('');
    }

    function selectStandardGroup(
        groupName: string,
    ) {
        setSelectedGroupName(
            groupName,
        );

        const group =
            standardGroups.find(
                item =>
                    item.name ===
                    groupName,
            );

        const firstAvailable =
            group?.materials.find(
                material =>
                    getAvailableQuantity(
                        material,
                    ) > 0,
            ) ??
            group?.materials[0];

        setSelectedMaterialId(
            firstAvailable?.id ??
            '',
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

        const firstAvailable =
            group?.materials.find(
                material =>
                    getAvailableQuantity(
                        material,
                    ) > 0,
            ) ??
            group?.materials[0];

        setSelectedMaterialId(
            firstAvailable?.id ??
            '',
        );
    }

    function getReservedQuantity(
        materialId: string,
    ) {
        return (
            lines.find(
                line =>
                    line.materialId ===
                    materialId,
            )?.quantity ?? 0
        );
    }

    function getAvailableQuantity(
        material:
            MaterialCatalogItem,
    ) {
        return Math.max(
            0,
            material.currentQuantity -
            getReservedQuantity(
                material.id,
            ),
        );
    }

    function changeQuickQuantity(
        delta: number,
    ) {
        if (
            !selectedMaterial ||
            selectedMaterial.kind ===
            'Oracal641'
        ) {
            return;
        }

        const current =
            Number(quantity) || 0;

        const available =
            getAvailableQuantity(
                selectedMaterial,
            );

        const next =
            Math.min(
                available,
                Math.max(
                    1,
                    current +
                    delta,
                ),
            );

        setQuantity(
            next.toString(),
        );
    }

    function addLine() {
        if (!selectedMaterial) {
            setError(
                'Выберите материал.',
            );

            return;
        }

        const parsedQuantity =
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

        if (
            selectedMaterial.kind !==
            'Oracal641' &&
            !Number.isInteger(
                parsedQuantity,
            )
        ) {
            setError(
                'Обычные материалы списываются только целыми штуками.',
            );

            return;
        }

        const alreadyAdded =
            getReservedQuantity(
                selectedMaterial.id,
            );

        const availableBeforeDocument =
            selectedMaterial.currentQuantity;

        if (
            alreadyAdded +
            parsedQuantity >
            availableBeforeDocument
        ) {
            setError(
                `Недостаточно материала. Доступно: ${numberFormatter.format(
                    Math.max(
                        0,
                        availableBeforeDocument -
                        alreadyAdded,
                    ),
                )} ${selectedMaterial.kind ===
                    'Oracal641'
                    ? 'м'
                    : 'шт.'
                }.`,
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

                        kind:
                            selectedMaterial.kind,

                        widthMeters:
                            selectedMaterial.widthMeters,

                        colorCode:
                            selectedMaterial.colorCode,

                        colorName:
                            selectedMaterial.colorName,

                        colorHex:
                            selectedMaterial.colorHex,

                        currentQuantity:
                            selectedMaterial.currentQuantity,

                        quantity:
                            parsedQuantity,
                    },
                ];
            },
        );

        setQuantity('1');
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

    function changeLineQuantity(
        materialId: string,
        nextQuantity: number,
    ) {
        const line =
            lines.find(
                item =>
                    item.materialId ===
                    materialId,
            );

        if (!line) {
            return;
        }

        let normalized =
            nextQuantity;

        if (
            line.kind !==
            'Oracal641'
        ) {
            normalized =
                Math.round(
                    normalized,
                );
        }

        normalized =
            Math.max(
                line.kind ===
                    'Oracal641'
                    ? 0.1
                    : 1,
                normalized,
            );

        normalized =
            Math.min(
                line.currentQuantity,
                normalized,
            );

        setLines(
            current =>
                current.map(
                    item =>
                        item.materialId ===
                            materialId
                            ? {
                                ...item,
                                quantity:
                                    normalized,
                            }
                            : item,
                ),
        );
    }

    async function postIssue() {
        if (
            lines.length ===
            0
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
                    `Позиция «${line.name}» должна иметь целое количество.`,
                );

                return;
            }

            if (
                line.quantity >
                line.currentQuantity
            ) {
                setError(
                    `Недостаточно материала «${line.name}».`,
                );

                return;
            }
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const createResponse =
                await api.post<WarehouseDocumentResponse>(
                    '/documents',
                    {
                        type:
                            'Issue',

                        supplier:
                            null,

                        externalNumber:
                            null,

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

            const postResponse =
                await api.post<WarehouseDocumentResponse>(
                    `/documents/${document.id}/post`,
                );

            setSuccess(
                `Расход ${postResponse.data.number} успешно проведён.`,
            );

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
                'Ошибка проведения расхода:',
                requestError,
            );

            setError(
                requestError?.response?.data
                    ?.message ??
                requestError?.response?.data
                    ?.title ??
                'Не удалось провести расход.',
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
                        Расход
                    </h1>

                    <p>
                        Выдача и списание
                        материалов со склада.
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

                    Обновить остатки
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

            <section className="panel">
                <div
                    style={
                        styles.sectionHeader
                    }
                >
                    <div>
                        <p className="eyebrow">
                            ISSUE DOCUMENT
                        </p>

                        <h2>
                            Данные расхода
                        </h2>
                    </div>
                </div>

                <div
                    style={
                        styles.commentArea
                    }
                >
                    <label
                        style={
                            styles.field
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
                            placeholder="Например: материалы переданы в печатный цех..."
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
                        Загрузка остатков...
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
                                        onChange={
                                            event =>
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

                                        {standardGroups.map(
                                            group => (
                                                <option
                                                    key={
                                                        group.name
                                                    }
                                                    value={
                                                        group.name
                                                    }
                                                >
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
                                        onChange={
                                            event =>
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
                                                material => {
                                                    const available =
                                                        getAvailableQuantity(
                                                            material,
                                                        );

                                                    return (
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
                                                                : 'Без ширины'}
                                                            {' · '}
                                                            доступно{' '}
                                                            {numberFormatter.format(
                                                                available,
                                                            )}{' '}
                                                            шт.
                                                        </option>
                                                    );
                                                },
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
                                        onChange={
                                            event =>
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
                                        onChange={
                                            event =>
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
                                                material => {
                                                    const available =
                                                        getAvailableQuantity(
                                                            material,
                                                        );

                                                    return (
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
                                                                : '—'}
                                                            {' · '}
                                                            доступно{' '}
                                                            {numberFormatter.format(
                                                                available,
                                                            )}{' '}
                                                            м
                                                        </option>
                                                    );
                                                },
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

                            {materialMode ===
                                'standard' ? (
                                <div
                                    style={
                                        styles.stepper
                                    }
                                >
                                    <button
                                        type="button"
                                        style={
                                            styles.stepperButton
                                        }
                                        onClick={() =>
                                            changeQuickQuantity(
                                                -1,
                                            )
                                        }
                                    >
                                        <Minus
                                            size={16}
                                        />
                                    </button>

                                    <input
                                        value={
                                            quantity
                                        }
                                        onChange={
                                            event =>
                                                setQuantity(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                        }
                                        style={
                                            styles.stepperInput
                                        }
                                    />

                                    <button
                                        type="button"
                                        style={
                                            styles.stepperButton
                                        }
                                        onClick={() =>
                                            changeQuickQuantity(
                                                1,
                                            )
                                        }
                                    >
                                        <Plus
                                            size={16}
                                        />
                                    </button>

                                    <span
                                        style={
                                            styles.unitText
                                        }
                                    >
                                        шт.
                                    </span>
                                </div>
                            ) : (
                                <div
                                    style={
                                        styles.quantityWrap
                                    }
                                >
                                    <input
                                        value={
                                            quantity
                                        }
                                        onChange={
                                            event =>
                                                setQuantity(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                        }
                                        placeholder="Например: 3,5"
                                        style={
                                            styles.input
                                        }
                                    />

                                    <span
                                        style={
                                            styles.unitBadge
                                        }
                                    >
                                        м
                                    </span>
                                </div>
                            )}
                        </label>

                        <button
                            type="button"
                            className="button primary"
                            style={{
                                alignSelf:
                                    'end',
                                minHeight:
                                    44,
                            }}
                            onClick={
                                addLine
                            }
                        >
                            <Plus
                                size={17}
                            />

                            Добавить
                        </button>
                    </div>
                )}

                {selectedMaterial && (
                    <div
                        style={
                            styles.stockPreview
                        }
                    >
                        {selectedMaterial.kind ===
                            'Oracal641' && (
                                <div
                                    style={{
                                        ...styles.colorSwatch,

                                        background:
                                            selectedMaterial.colorHex ??
                                            '#777',
                                    }}
                                />
                            )}

                        <div>
                            <div
                                style={
                                    styles.helper
                                }
                            >
                                Текущий остаток
                            </div>

                            <strong
                                style={
                                    styles.stockValue
                                }
                            >
                                {numberFormatter.format(
                                    selectedMaterial.currentQuantity,
                                )}{' '}
                                {selectedMaterial.kind ===
                                    'Oracal641'
                                    ? 'м'
                                    : 'шт.'}
                            </strong>
                        </div>

                        <div>
                            <div
                                style={
                                    styles.helper
                                }
                            >
                                Уже добавлено
                            </div>

                            <strong>
                                {numberFormatter.format(
                                    getReservedQuantity(
                                        selectedMaterial.id,
                                    ),
                                )}{' '}
                                {selectedMaterial.kind ===
                                    'Oracal641'
                                    ? 'м'
                                    : 'шт.'}
                            </strong>
                        </div>

                        <div>
                            <div
                                style={
                                    styles.helper
                                }
                            >
                                Доступно ещё
                            </div>

                            <strong>
                                {numberFormatter.format(
                                    getAvailableQuantity(
                                        selectedMaterial,
                                    ),
                                )}{' '}
                                {selectedMaterial.kind ===
                                    'Oracal641'
                                    ? 'м'
                                    : 'шт.'}
                            </strong>
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
                            Позиции расхода
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
                            Штучных материалов:{' '}
                            {numberFormatter.format(
                                totalPieces,
                            )}{' '}
                            шт.
                            {' · '}
                            ORACAL:{' '}
                            {numberFormatter.format(
                                totalMeters,
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
                            onChange={
                                event =>
                                    setSearch(
                                        event
                                            .target
                                            .value,
                                    )
                            }
                            placeholder="Поиск..."
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
                                    Было
                                </th>

                                <th>
                                    Списать
                                </th>

                                <th>
                                    Останется
                                </th>

                                <th />
                            </tr>
                        </thead>

                        <tbody>
                            {filteredLines.map(
                                line => {
                                    const after =
                                        line.currentQuantity -
                                        line.quantity;

                                    return (
                                        <tr
                                            key={
                                                line.materialId
                                            }
                                        >
                                            <td>
                                                <div
                                                    style={
                                                        styles.materialCell
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

                                                        <div
                                                            style={
                                                                styles.helper
                                                            }
                                                        >
                                                            {
                                                                line.article
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td>
                                                {line.widthMeters
                                                    ? formatWidth(
                                                        line.widthMeters,
                                                    )
                                                    : '—'}
                                            </td>

                                            <td>
                                                {numberFormatter.format(
                                                    line.currentQuantity,
                                                )}{' '}
                                                {line.kind ===
                                                    'Oracal641'
                                                    ? 'м'
                                                    : 'шт.'}
                                            </td>

                                            <td>
                                                <div
                                                    style={
                                                        styles.lineStepper
                                                    }
                                                >
                                                    {line.kind !==
                                                        'Oracal641' && (
                                                            <button
                                                                type="button"
                                                                style={
                                                                    styles.smallStepperButton
                                                                }
                                                                onClick={() =>
                                                                    changeLineQuantity(
                                                                        line.materialId,
                                                                        line.quantity -
                                                                        1,
                                                                    )
                                                                }
                                                            >
                                                                <Minus
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            </button>
                                                        )}

                                                    <input
                                                        type="number"
                                                        min={
                                                            line.kind ===
                                                                'Oracal641'
                                                                ? '0.1'
                                                                : '1'
                                                        }
                                                        max={
                                                            line.currentQuantity
                                                        }
                                                        step={
                                                            line.kind ===
                                                                'Oracal641'
                                                                ? '0.1'
                                                                : '1'
                                                        }
                                                        value={
                                                            line.quantity
                                                        }
                                                        onChange={
                                                            event =>
                                                                changeLineQuantity(
                                                                    line.materialId,
                                                                    Number(
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    ),
                                                                )
                                                        }
                                                        style={
                                                            styles.quantityInput
                                                        }
                                                    />

                                                    {line.kind !==
                                                        'Oracal641' && (
                                                            <button
                                                                type="button"
                                                                style={
                                                                    styles.smallStepperButton
                                                                }
                                                                onClick={() =>
                                                                    changeLineQuantity(
                                                                        line.materialId,
                                                                        line.quantity +
                                                                        1,
                                                                    )
                                                                }
                                                            >
                                                                <Plus
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                            </button>
                                                        )}

                                                    <span>
                                                        {line.kind ===
                                                            'Oracal641'
                                                            ? 'м'
                                                            : 'шт.'}
                                                    </span>
                                                </div>
                                            </td>

                                            <td>
                                                <strong
                                                    style={{
                                                        color:
                                                            after <=
                                                                0
                                                                ? '#fca5a5'
                                                                : '#86efac',
                                                    }}
                                                >
                                                    {numberFormatter.format(
                                                        after,
                                                    )}{' '}
                                                    {line.kind ===
                                                        'Oracal641'
                                                        ? 'м'
                                                        : 'шт.'}
                                                </strong>
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
                                                >
                                                    <Trash2
                                                        size={
                                                            16
                                                        }
                                                    />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                },
                            )}

                            {lines.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                6
                                            }
                                        >
                                            В расход пока ничего не добавлено.
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
                        <strong>
                            Готово к списанию
                        </strong>

                        <div
                            style={
                                styles.helper
                            }
                        >
                            После проведения документа остатки будут уменьшены.
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
                            postIssue
                        }
                    >
                        <ArrowUpFromLine
                            size={18}
                        />

                        {saving
                            ? 'Проведение...'
                            : 'Провести расход'}
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

    commentArea: {
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
            80,

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
            'minmax(220px, 1.4fr) minmax(180px, 1fr) minmax(170px, .9fr) auto',

        gap:
            12,

        padding:
            18,

        alignItems:
            'end',
    },

    stepper: {
        minHeight:
            44,

        display:
            'grid',

        gridTemplateColumns:
            '42px 1fr 42px auto',

        alignItems:
            'center',

        border:
            '1px solid #303b4a',

        borderRadius:
            10,

        overflow:
            'hidden',

        background:
            '#151e29',
    },

    stepperButton: {
        height:
            '100%',

        border:
            0,

        background:
            'rgba(255,255,255,.04)',

        color:
            '#fff',

        cursor:
            'pointer',
    },

    stepperInput: {
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

        textAlign:
            'center',

        fontWeight:
            800,
    },

    unitText: {
        paddingRight:
            10,

        color:
            '#77879a',

        fontSize:
            11,
    },

    quantityWrap: {
        position:
            'relative',
    },

    unitBadge: {
        position:
            'absolute',

        right:
            12,

        top:
            '50%',

        transform:
            'translateY(-50%)',

        color:
            '#77879a',

        fontSize:
            11,
    },

    stockPreview: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            26,

        flexWrap:
            'wrap',

        margin:
            '0 18px 18px',

        padding:
            14,

        border:
            '1px solid #293542',

        borderRadius:
            10,

        background:
            '#101820',
    },

    stockValue: {
        fontSize:
            18,
    },

    colorSwatch: {
        width:
            38,

        height:
            38,

        borderRadius:
            8,

        border:
            '1px solid rgba(255,255,255,.25)',
    },

    smallColorSwatch: {
        width:
            25,

        height:
            25,

        flex:
            '0 0 auto',

        borderRadius:
            6,

        border:
            '1px solid rgba(255,255,255,.22)',
    },

    materialCell: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            10,
    },

    lineStepper: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            5,
    },

    smallStepperButton: {
        width:
            30,

        height:
            30,

        display:
            'grid',

        placeItems:
            'center',

        border:
            '1px solid #303b4a',

        borderRadius:
            7,

        background:
            '#151e29',

        color:
            '#fff',

        cursor:
            'pointer',
    },

    quantityInput: {
        width:
            80,

        minHeight:
            30,

        boxSizing:
            'border-box',

        border:
            '1px solid #303b4a',

        borderRadius:
            7,

        background:
            '#101820',

        color:
            '#fff',

        textAlign:
            'center',
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

    searchBox: {
        minWidth:
            220,

        display:
            'flex',

        alignItems:
            'center',

        gap:
            8,

        border:
            '1px solid #303b4a',

        borderRadius:
            9,

        background:
            '#121a24',

        padding:
            '0 10px',
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
            8,

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

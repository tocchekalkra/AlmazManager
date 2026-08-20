import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type FormEvent,
} from 'react';

import {
    Archive,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Edit3,
    Droplets,
    GripVertical,
    Lock,
    Package,
    Palette,
    Plus,
    RefreshCcw,
    Search,
    Unlock,
    X,
} from 'lucide-react';

import api from '../api/api';
import { loadAllMaterialCatalogItems } from '../api/catalog';
import { useAuth } from '../auth/AuthContext';
import {
    filmCategoryParts,
    filmMarkerText,
    findFilmCategoryId,
} from '../utils/material';

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
    machineName?: string | null;
    packageLiters?: number | null;
};

type Category = {
    id: string;
    name: string;
    isActive: boolean;
};

type MaterialForm = {
    id?: string;

    kind: 'Standard' | 'Oracal641' | 'Ink';

    name: string;
    article: string;
    articlePrefix: string;

    categoryId: string;
    filmBase: 'White' | 'Transparent';
    filmFinish: 'Matte' | 'Glossy';

    minimumQuantity: string;
    currentQuantity: number;

    widthMeters: string;

    colorCode: string;
    colorName: string;
    colorHex: string;
    machineName: string;
    packageLiters: '1' | '5';

    isActive: boolean;
};

type OracalColor = {
    code: string;
    name: string;
    hex: string;
};

type StandardMaterialGroup = {
    key: string;
    name: string;
    categoryId: string;
    categoryName: string;

    materials: MaterialCatalogItem[];

    totalQuantity: number;
    lowCount: number;
    emptyCount: number;
};

type WidthPreset = {
    id: string;
    name: string;
    widths: number[];
};

const widthPresets: WidthPreset[] = [
    {
        id: 'banner',
        name: 'Баннер',
        widths: [
            3.2,
            2.5,
            2.2,
            1.6,
            1.37,
            1.1,
        ],
    },

    {
        id: 'film',
        name: 'Плёнка',
        widths: [
            2,
            1.6,
            1.52,
            1.37,
            1.26,
            1.05,
            1,
        ],
    },
];

const oracalPalette: OracalColor[] = [
    {
        code: '010',
        name: 'Белый',
        hex: '#E7EAEE',
    },
    {
        code: '021',
        name: 'Жёлтый',
        hex: '#F2C500',
    },
    {
        code: '031',
        name: 'Красный',
        hex: '#AF000B',
    },
    {
        code: '040',
        name: 'Фиолетовый',
        hex: '#6A325D',
    },
    {
        code: '041',
        name: 'Малиновый',
        hex: '#B51A49',
    },
    {
        code: '042',
        name: 'Сиреневый',
        hex: '#8A4B78',
    },
    {
        code: '045',
        name: 'Светло-розовый',
        hex: '#E998B7',
    },
    {
        code: '049',
        name: 'Королевский синий',
        hex: '#1F4F99',
    },
    {
        code: '050',
        name: 'Тёмно-синий',
        hex: '#193A70',
    },
    {
        code: '051',
        name: 'Гентский синий',
        hex: '#20589C',
    },
    {
        code: '052',
        name: 'Лазурный',
        hex: '#1873A5',
    },
    {
        code: '053',
        name: 'Светло-синий',
        hex: '#4C94BC',
    },
    {
        code: '054',
        name: 'Бирюзовый',
        hex: '#008E9A',
    },
    {
        code: '055',
        name: 'Мятный',
        hex: '#65B9AF',
    },
    {
        code: '056',
        name: 'Ледяной голубой',
        hex: '#89C6D0',
    },
    {
        code: '060',
        name: 'Тёмно-зелёный',
        hex: '#1F5B3A',
    },
    {
        code: '061',
        name: 'Зелёный',
        hex: '#158347',
    },
    {
        code: '062',
        name: 'Светло-зелёный',
        hex: '#52A94F',
    },
    {
        code: '063',
        name: 'Лаймовый',
        hex: '#A6C83A',
    },
    {
        code: '070',
        name: 'Чёрный',
        hex: '#060607',
    },
    {
        code: '071',
        name: 'Серый',
        hex: '#80858A',
    },
    {
        code: '072',
        name: 'Светло-серый',
        hex: '#B4B8BB',
    },
    {
        code: '073',
        name: 'Тёмно-серый',
        hex: '#55595C',
    },
    {
        code: '080',
        name: 'Коричневый',
        hex: '#563A2D',
    },
    {
        code: '081',
        name: 'Светло-коричневый',
        hex: '#8A684E',
    },
    {
        code: '090',
        name: 'Серебристый',
        hex: '#A8AAAB',
    },
    {
        code: '091',
        name: 'Золотой',
        hex: '#A48B52',
    },
];

const emptyForm: MaterialForm = {
    kind: 'Standard',

    name: '',
    article: '',
    articlePrefix: '',

    categoryId: '',
    filmBase: 'White',
    filmFinish: 'Matte',

    minimumQuantity: '0',
    currentQuantity: 0,

    widthMeters: '',

    colorCode: '',
    colorName: '',
    colorHex: '',
    machineName: 'Широкоформатный',
    packageLiters: '1',

    isActive: true,
};

const numberFormatter =
    new Intl.NumberFormat(
        'ru-RU',
        {
            maximumFractionDigits: 2,
        },
    );

const inkColors = [
    { name: 'Cyan', hex: '#00AEEF' },
    { name: 'Magenta', hex: '#EC008C' },
    { name: 'Yellow', hex: '#FFF200' },
    { name: 'Black', hex: '#111111' },
    { name: 'White', hex: '#F4F4F4' },
];

const defaultMachines = ['Широкоформатный', 'Интерьерный', 'Рулонный УФ'];

export default function MaterialsPage() {
    const { user } = useAuth();
    const isAdministrator = user?.role === 'Administrator';
    const [access, setAccess] = useState({
        canManageMaterials: isAdministrator,
        canArchiveMaterials: isAdministrator,
        canRestoreMaterials: isAdministrator,
        canPermanentlyDeleteMaterials: isAdministrator,
    });

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

    const [search, setSearch] =
        useState('');

    const [
        categoryFilter,
        setCategoryFilter,
    ] = useState('all');

    const [
        statusFilter,
        setStatusFilter,
    ] = useState('active');

    const [formOpen, setFormOpen] =
        useState(false);

    const [form, setForm] =
        useState<MaterialForm>(
            emptyForm,
        );

    const [orderMode, setOrderMode] = useState(false);
    const [draggedGroupKey, setDraggedGroupKey] = useState<string | null>(null);
    const [draggedOracalKey, setDraggedOracalKey] = useState<string | null>(null);

    const [
        selectedWidths,
        setSelectedWidths,
    ] = useState<number[]>([]);

    const [
        customWidth,
        setCustomWidth,
    ] = useState('');

    const [
        selectedPreset,
        setSelectedPreset,
    ] = useState('banner');

    const [
        expandedGroups,
        setExpandedGroups,
    ] = useState<Set<string>>(
        () => new Set(),
    );

    const editing =
        Boolean(form.id);

    const reorderingAvailable =
        search.trim() === '' &&
        categoryFilter === 'all' &&
        statusFilter === 'active' &&
        !loading;

    useEffect(() => {
        loadData();
        api.get<typeof access>('/users/me/access')
            .then((response) => setAccess(response.data))
            .catch(() => undefined);
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const [
                materialItems,
                categoriesResponse,
            ] = await Promise.all([
                loadAllMaterialCatalogItems<MaterialCatalogItem>(),

                api.get<Category[]>(
                    '/categories',
                ),
            ]);

            setMaterials(
                materialItems,
            );

            setCategories(
                categoriesResponse
                    .data ?? [],
            );
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка загрузки материалов:',
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
                'Не удалось загрузить материалы.',
            );
        } finally {
            setLoading(false);
        }
    }

    const categoryMap =
        useMemo(
            () =>
                new Map(
                    categories.map(
                        (
                            category,
                        ) => [
                                category.id,
                                category.name,
                            ],
                    ),
                ),
            [categories],
        );

    const filteredMaterials =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            return materials.filter(
                (material) => {
                    const categoryName =
                        categoryMap.get(
                            material.categoryId,
                        ) ?? '';

                    const colorText =
                        `${material.colorCode ??
                            ''
                            } ${material.colorName ??
                            ''
                            }`.toLowerCase();

                    const matchesSearch =
                        !normalizedSearch ||
                        material.name
                            .toLowerCase()
                            .includes(
                                normalizedSearch,
                            ) ||
                        material.article
                            .toLowerCase()
                            .includes(
                                normalizedSearch,
                            ) ||
                        categoryName
                            .toLowerCase()
                            .includes(
                                normalizedSearch,
                            ) ||
                        colorText.includes(
                            normalizedSearch,
                        );

                    const matchesCategory =
                        categoryFilter ===
                        'all' ||
                        material.categoryId ===
                        categoryFilter;

                    let matchesStatus = true;

                    if (
                        statusFilter ===
                        'active'
                    ) {
                        matchesStatus =
                            material.isActive;
                    }

                    if (
                        statusFilter ===
                        'archived'
                    ) {
                        matchesStatus =
                            !material.isActive;
                    }

                    if (
                        statusFilter ===
                        'low'
                    ) {
                        matchesStatus =
                            material.isActive &&
                            material.belowMinimum &&
                            material.currentQuantity >
                            0;
                    }

                    if (
                        statusFilter ===
                        'empty'
                    ) {
                        matchesStatus =
                            material.isActive &&
                            material.currentQuantity <=
                            0;
                    }

                    return (
                        matchesSearch &&
                        matchesCategory &&
                        matchesStatus
                    );
                },
            );
        }, [
            materials,
            search,
            categoryFilter,
            statusFilter,
            categoryMap,
        ]);

    const standardMaterials =
        useMemo(
            () =>
                filteredMaterials.filter(
                    (material) =>
                        material.kind === 'Standard',
                ),
            [filteredMaterials],
        );

    const standardGroups =
        useMemo(() => {
            const groups =
                new Map<
                    string,
                    StandardMaterialGroup
                >();

            for (
                const material of
                standardMaterials
            ) {
                const normalizedName =
                    normalizeMaterialGroupName(
                        material.name,
                    );

                const key =
                    `${material.categoryId}::${normalizedName.toLowerCase()}`;

                let group =
                    groups.get(key);

                if (!group) {
                    group = {
                        key,

                        name:
                            normalizedName,

                        categoryId:
                            material.categoryId,

                        categoryName:
                            categoryMap.get(
                                material.categoryId,
                            ) ??
                            'Без категории',

                        materials:
                            [],

                        totalQuantity:
                            0,

                        lowCount:
                            0,

                        emptyCount:
                            0,
                    };

                    groups.set(
                        key,
                        group,
                    );
                }

                group.materials.push(
                    material,
                );

                group.totalQuantity +=
                    material.currentQuantity;

                if (
                    material.isActive &&
                    material.belowMinimum
                ) {
                    group.lowCount += 1;
                }

                if (
                    material.isActive &&
                    material.currentQuantity <=
                    0
                ) {
                    group.emptyCount += 1;
                }
            }

            return Array.from(groups.values())
                .map((group) => ({
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
            categoryMap,
        ]);

    const oracalMaterials =
        useMemo(
            () =>
                filteredMaterials.filter(
                    (material) =>
                        material.kind ===
                        'Oracal641',
                ),
            [filteredMaterials],
        );

    const inkMaterials = useMemo(
        () => filteredMaterials
            .filter((material) => material.kind === 'Ink')
            .slice()
            .sort((a, b) =>
                (a.machineName ?? '').localeCompare(b.machineName ?? '', 'ru') ||
                (a.colorName ?? '').localeCompare(b.colorName ?? '', 'en') ||
                Number(a.packageLiters ?? 0) - Number(b.packageLiters ?? 0)),
        [filteredMaterials],
    );

    const oracalRows =
        useMemo(() => {
            const rows =
                new Map<
                    string,
                    {
                        key: string;
                        code: string;
                        name: string;
                        hex: string;

                        width100?: MaterialCatalogItem;
                        width127?: MaterialCatalogItem;
                    }
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

                const current =
                    rows.get(key) ?? {
                        key,
                        code,

                        name:
                            material.colorName ??
                            material.name,

                        hex:
                            material.colorHex ??
                            '#777777',
                    };

                if (
                    Number(
                        material.widthMeters,
                    ) === 1
                ) {
                    current.width100 =
                        material;
                }

                if (
                    Number(
                        material.widthMeters,
                    ) === 1.27
                ) {
                    current.width127 =
                        material;
                }

                rows.set(
                    key,
                    current,
                );
            }

            return Array.from(rows.values());
        }, [
            oracalMaterials,
        ]);

    const activeMaterials =
        materials.filter(
            (material) =>
                material.isActive,
        ).length;

    const belowMinimum =
        materials.filter(
            (material) =>
                material.isActive &&
                material.belowMinimum,
        ).length;

    const withoutStock =
        materials.filter(
            (material) =>
                material.isActive &&
                material.currentQuantity <=
                0,
        ).length;

    function toggleGroup(
        key: string,
    ) {
        setExpandedGroups(
            (current) => {
                const next =
                    new Set(
                        current,
                    );

                if (
                    next.has(key)
                ) {
                    next.delete(
                        key,
                    );
                } else {
                    next.add(
                        key,
                    );
                }

                return next;
            },
        );
    }

    function expandAllGroups() {
        setExpandedGroups(
            new Set(
                standardGroups.map(
                    (group) =>
                        group.key,
                ),
            ),
        );
    }

    function collapseAllGroups() {
        setExpandedGroups(
            new Set(),
        );
    }

    async function reorderStandardGroup(targetKey: string) {
        if (!orderMode || !draggedGroupKey || draggedGroupKey === targetKey) return;

        const groups = [...standardGroups];
        const from = groups.findIndex(group => group.key === draggedGroupKey);
        const to = groups.findIndex(group => group.key === targetKey);
        if (from < 0 || to < 0) return;

        const [moved] = groups.splice(from, 1);
        groups.splice(to, 0, moved);

        const standardIds = groups.flatMap(group => group.materials.map(material => material.id));
        const oracalIds = materials
            .filter(material => material.kind === 'Oracal641')
            .map(material => material.id);

        try {
            setSaving(true);
            setError('');
            await api.put('/preferences', {
                materialOrder: [...standardIds, ...oracalIds],
            });
            setDraggedGroupKey(null);
            await loadData();
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось сохранить персональный порядок материалов.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function reorderOracalRow(targetKey: string) {
        if (!orderMode || !draggedOracalKey || draggedOracalKey === targetKey) return;

        const rows = [...oracalRows];
        const from = rows.findIndex(row => row.key === draggedOracalKey);
        const to = rows.findIndex(row => row.key === targetKey);
        if (from < 0 || to < 0) return;

        const [moved] = rows.splice(from, 1);
        rows.splice(to, 0, moved);

        const standardIds = materials
            .filter(material => material.kind !== 'Oracal641')
            .map(material => material.id);
        const oracalIds = rows.flatMap(row => [row.width100, row.width127]
            .filter((material): material is MaterialCatalogItem => Boolean(material))
            .map(material => material.id));

        try {
            setSaving(true);
            setError('');
            await api.put('/preferences', {
                materialOrder: [...standardIds, ...oracalIds],
            });
            setDraggedOracalKey(null);
            await loadData();
        } catch (requestError: any) {
            setError(
                requestError?.response?.data?.message ??
                'Не удалось сохранить персональный порядок ORACAL.',
            );
        } finally {
            setSaving(false);
        }
    }

    function applyPreset(
        presetId: string,
    ) {
        const preset =
            widthPresets.find(
                (item) =>
                    item.id ===
                    presetId,
            );

        if (!preset) {
            return;
        }

        setSelectedPreset(
            presetId,
        );

        setSelectedWidths(
            preset.widths,
        );

        if (presetId === 'film') {
            setForm((current) => ({
                ...current,
                categoryId: findFilmCategoryId(
                    categories,
                    current.filmBase,
                    current.filmFinish,
                ),
            }));
        }
    }

    function changeFilmType(
        filmBase: 'White' | 'Transparent',
        filmFinish: 'Matte' | 'Glossy',
    ) {
        const categoryId = findFilmCategoryId(
            categories,
            filmBase,
            filmFinish,
        );

        setForm((current) => ({
            ...current,
            filmBase,
            filmFinish,
            categoryId: categoryId || current.categoryId,
        }));
    }

    function toggleWidth(
        width: number,
    ) {
        setSelectedWidths(
            (current) => {
                if (
                    current.includes(
                        width,
                    )
                ) {
                    return current.filter(
                        (item) =>
                            item !==
                            width,
                    );
                }

                return [
                    ...current,
                    width,
                ].sort(
                    (a, b) =>
                        b - a,
                );
            },
        );
    }

    function addCustomWidth() {
        const value =
            Number(
                customWidth.replace(
                    ',',
                    '.',
                ),
            );

        if (
            Number.isNaN(value) ||
            value <= 0
        ) {
            setError(
                'Введите корректную ширину.',
            );

            return;
        }

        const rounded =
            Math.round(
                value * 100,
            ) / 100;

        setSelectedWidths(
            (current) => {
                if (
                    current.includes(
                        rounded,
                    )
                ) {
                    return current;
                }

                return [
                    ...current,
                    rounded,
                ].sort(
                    (a, b) =>
                        b - a,
                );
            },
        );

        setCustomWidth('');
        setError('');
    }

    function openCreate() {
        const firstCategory =
            categories.find(
                (category) =>
                    category.isActive,
            );

        setForm({
            ...emptyForm,

            categoryId:
                firstCategory?.id ??
                '',
        });

        setSelectedPreset(
            'banner',
        );

        setSelectedWidths(
            widthPresets[0].widths,
        );

        setCustomWidth('');

        setError('');
        setFormOpen(true);
    }

    function openCreateOracal() {
        const firstColor =
            oracalPalette[0];

        const oracalCategory =
            categories.find(
                (category) =>
                    category.isActive &&
                    category.name
                        .toLowerCase()
                        .includes(
                            'oracal',
                        ),
            ) ??
            categories.find(
                (category) =>
                    category.isActive &&
                    category.name
                        .toLowerCase()
                        .includes(
                            'оракал',
                        ),
            ) ??
            categories.find(
                (category) =>
                    category.isActive,
            );

        setForm({
            ...emptyForm,

            kind:
                'Oracal641',

            categoryId:
                oracalCategory?.id ??
                '',

            widthMeters:
                '1',

            colorCode:
                firstColor.code,

            colorName:
                firstColor.name,

            colorHex:
                firstColor.hex,
        });

        setSelectedWidths([]);
        setCustomWidth('');

        setError('');
        setFormOpen(true);
    }

    function openCreateInk() {
        const inkCategory = categories.find((category) =>
            category.isActive && category.name.toLowerCase() === 'краска') ??
            categories.find((category) => category.isActive);
        const firstColor = inkColors[0];

        setForm({
            ...emptyForm,
            kind: 'Ink',
            categoryId: inkCategory?.id ?? '',
            name: `Краска ${firstColor.name}`,
            colorCode: firstColor.name,
            colorName: firstColor.name,
            colorHex: firstColor.hex,
            machineName: defaultMachines[0],
            packageLiters: '1',
        });
        setSelectedWidths([]);
        setCustomWidth('');
        setError('');
        setFormOpen(true);
    }

    function openEdit(
        material: MaterialCatalogItem,
    ) {
        const category = categories.find(item => item.id === material.categoryId);
        const film = filmCategoryParts(category?.name ?? '');

        setForm({
            id:
                material.id,

            kind:
                material.kind ===
                    'Oracal641'
                    ? 'Oracal641'
                    : material.kind === 'Ink'
                        ? 'Ink'
                        : 'Standard',

            name:
                material.name,

            article:
                material.article,

            articlePrefix:
                '',

            categoryId:
                material.categoryId,

            filmBase:
                film.base,

            filmFinish:
                film.finish,

            minimumQuantity:
                material.minimumQuantity.toString(),

            currentQuantity:
                material.currentQuantity,

            widthMeters:
                material.widthMeters
                    ?.toString() ??
                '',

            colorCode:
                material.colorCode ??
                '',

            colorName:
                material.colorName ??
                '',

            colorHex:
                material.colorHex ??
                '',

            machineName: material.machineName ?? 'Широкоформатный',
            packageLiters: material.packageLiters === 5 ? '5' : '1',

            isActive:
                material.isActive,
        });

        setSelectedWidths([]);
        setCustomWidth('');
        setSelectedPreset(film.isFilm ? 'film' : 'custom');

        setError('');
        setFormOpen(true);
    }

    function closeForm() {
        if (saving) {
            return;
        }

        setFormOpen(false);

        setForm(
            emptyForm,
        );

        setSelectedWidths([]);
        setCustomWidth('');
    }

    function selectOracalColor(
        code: string,
    ) {
        const selected =
            oracalPalette.find(
                (color) =>
                    color.code ===
                    code,
            );

        if (!selected) {
            return;
        }

        setForm(
            (current) => ({
                ...current,

                colorCode:
                    selected.code,

                colorName:
                    selected.name,

                colorHex:
                    selected.hex,
            }),
        );
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const minimumQuantity =
            Number(
                form.minimumQuantity,
            );

        if (
            !form.categoryId
        ) {
            setError(
                'Выберите категорию.',
            );

            return;
        }

        if (
            Number.isNaN(
                minimumQuantity,
            ) ||
            minimumQuantity < 0
        ) {
            setError(
                'Минимальный остаток должен быть равен нулю или больше.',
            );

            return;
        }

        try {
            setSaving(true);
            setError('');

            /*
             * РЕДАКТИРОВАНИЕ
             */
            if (editing) {
                const width =
                    form.widthMeters.trim()
                        ? Number(
                            form.widthMeters.replace(
                                ',',
                                '.',
                            ),
                        )
                        : null;

                if (
                    width !== null &&
                    (
                        Number.isNaN(
                            width,
                        ) ||
                        width <= 0
                    )
                ) {
                    setError(
                        'Ширина должна быть больше нуля.',
                    );

                    return;
                }

                if (form.kind === 'Ink') {
                    if (!form.machineName.trim()) {
                        setError('Укажите станок.');
                        return;
                    }

                    await api.put(`/materials/${form.id}`, {
                        name: `Краска ${form.colorName}`,
                        article: form.article.trim() || `INK-${slug(form.machineName)}-${form.colorName.toUpperCase()}-${form.packageLiters}L`,
                        categoryId: form.categoryId,
                        unit: 'Liter',
                        minimumQuantity,
                        kind: 'Ink',
                        widthMeters: null,
                        colorCode: form.colorName,
                        colorName: form.colorName,
                        colorHex: form.colorHex,
                        machineName: form.machineName.trim(),
                        packageLiters: Number(form.packageLiters),
                    });
                } else if (
                    form.kind ===
                    'Oracal641'
                ) {
                    if (
                        width !== 1 &&
                        width !== 1.27
                    ) {
                        setError(
                            'Для ORACAL 641 разрешены ширины 1,00 и 1,27 м.',
                        );

                        return;
                    }

                    await api.put(
                        `/materials/${form.id}`,
                        {
                            name:
                                'ORACAL 641',

                            article:
                                `ORACAL-641-${form.colorCode}-${width === 1
                                    ? '100'
                                    : '127'
                                }`,

                            categoryId:
                                form.categoryId,

                            unit:
                                'Meter',

                            minimumQuantity,

                            kind:
                                'Oracal641',

                            widthMeters:
                                width,

                            colorCode:
                                form.colorCode,

                            colorName:
                                form.colorName,

                            colorHex:
                                form.colorHex,
                        },
                    );
                } else {
                    if (
                        !form.name.trim()
                    ) {
                        setError(
                            'Введите название материала.',
                        );

                        return;
                    }

                    if (
                        !form.article.trim()
                    ) {
                        setError(
                            'Введите артикул материала.',
                        );

                        return;
                    }

                    await api.put(
                        `/materials/${form.id}`,
                        {
                            name:
                                form.name.trim(),

                            article:
                                form.article.trim(),

                            categoryId:
                                form.categoryId,

                            unit:
                                'Piece',

                            minimumQuantity,

                            kind:
                                'Standard',

                            widthMeters:
                                width,

                            colorCode:
                                null,

                            colorName:
                                null,

                            colorHex:
                                null,
                        },
                    );
                }
            }

            /*
             * СОЗДАНИЕ ORACAL
             */
            else if (form.kind === 'Ink') {
                if (!form.machineName.trim()) {
                    setError('Укажите станок.');
                    return;
                }

                await api.post('/materials', {
                    name: `Краска ${form.colorName}`,
                    article: `INK-${slug(form.machineName)}-${form.colorName.toUpperCase()}-${form.packageLiters}L`,
                    categoryId: form.categoryId,
                    unit: 'Liter',
                    minimumQuantity,
                    kind: 'Ink',
                    widthMeters: null,
                    colorCode: form.colorName,
                    colorName: form.colorName,
                    colorHex: form.colorHex,
                    machineName: form.machineName.trim(),
                    packageLiters: Number(form.packageLiters),
                });
            }

            /* СОЗДАНИЕ ORACAL */
            else if (
                form.kind ===
                'Oracal641'
            ) {
                const width =
                    Number(
                        form.widthMeters,
                    );

                if (
                    width !== 1 &&
                    width !== 1.27
                ) {
                    setError(
                        'Для ORACAL 641 разрешены ширины 1,00 и 1,27 м.',
                    );

                    return;
                }

                await api.post(
                    '/materials',
                    {
                        name:
                            'ORACAL 641',

                        article:
                            `ORACAL-641-${form.colorCode}-${width === 1
                                ? '100'
                                : '127'
                            }`,

                        categoryId:
                            form.categoryId,

                        unit:
                            'Meter',

                        minimumQuantity,

                        kind:
                            'Oracal641',

                        widthMeters:
                            width,

                        colorCode:
                            form.colorCode,

                        colorName:
                            form.colorName,

                        colorHex:
                            form.colorHex,
                    },
                );
            }

            /*
             * МАССОВОЕ СОЗДАНИЕ
             * ОБЫЧНЫХ МАТЕРИАЛОВ
             */
            else {
                if (
                    !form.name.trim()
                ) {
                    setError(
                        'Введите название материала.',
                    );

                    return;
                }

                if (
                    !form.articlePrefix.trim()
                ) {
                    setError(
                        'Введите префикс артикула.',
                    );

                    return;
                }

                if (
                    selectedWidths.length ===
                    0
                ) {
                    setError(
                        'Выберите хотя бы одну ширину.',
                    );

                    return;
                }

                await api.post(
                    '/materials/bulk-standard',
                    {
                        name:
                            form.name.trim(),

                        articlePrefix:
                            form.articlePrefix
                                .trim()
                                .toUpperCase(),

                        categoryId:
                            form.categoryId,

                        minimumQuantity,

                        widths:
                            selectedWidths,
                    },
                );
            }

            setFormOpen(false);

            setForm(
                emptyForm,
            );

            setSelectedWidths([]);
            setCustomWidth('');

            await loadData();
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка сохранения материала:',
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
                'Не удалось сохранить материал.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function changeActivity(
        material: MaterialCatalogItem,
    ) {
        const action =
            material.isActive
                ? 'archive'
                : 'restore';

        let confirmation =
            material.isActive
                ? `Архивировать материал «${material.name}»?`
                : `Восстановить материал «${material.name}»?`;

        if (material.isActive) {
            try {
                const impact = await api.get<{ openSupplyLinks: number }>(`/materials/${material.id}/archive-impact`);
                if (impact.data.openSupplyLinks > 0) {
                    confirmation += `\n\nВнимание: материал присутствует в ${impact.data.openSupplyLinks} незавершённых поставках.`;
                }
                confirmation += '\nИстория операций и документы сохранятся.';
            } catch {
                // Основное действие всё равно защищено сервером.
            }
        }

        if (
            !window.confirm(
                confirmation,
            )
        ) {
            return;
        }

        try {
            setError('');

            await api.patch(
                `/materials/${material.id}/${action}`,
            );

            await loadData();

            if (
                formOpen &&
                form.id ===
                material.id
            ) {
                closeForm();
            }
        } catch (
        requestError: any
        ) {
            setError(
                requestError
                    ?.response
                    ?.data
                    ?.message ??
                'Не удалось изменить статус материала.',
            );
        }
    }

    async function deletePermanently(material: MaterialCatalogItem) {
        const confirmationName = window.prompt(`Безвозвратное удаление возможно только без истории. Введите точное название:\n${material.name}`);
        if (confirmationName === null) return;
        try {
            await api.delete(`/materials/${material.id}/permanent`, { data: { confirmationName } });
            closeForm();
            await loadData();
        } catch (requestError: any) {
            setError(requestError?.response?.data?.message ?? 'Не удалось удалить материал. Используйте архив.');
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
                        Материалы
                    </h1>

                    <p>
                        Обычные материалы учитываются в штуках.
                        ORACAL 641 — в погонных метрах, краска — в литрах.
                    </p>
                </div>

                {access.canManageMaterials && (
                    <div
                        style={
                            styles.headingActions
                        }
                    >
                        <button
                            type="button"
                            className="button secondary"
                            onClick={openCreateInk}
                        >
                            <Droplets size={17} />
                            Добавить краску
                        </button>

                        <button
                            type="button"
                            className="button secondary"
                            onClick={
                                openCreateOracal
                            }
                        >
                            <Palette size={17} />
                            Добавить ORACAL
                        </button>

                        <button
                            type="button"
                            className="button primary"
                            onClick={
                                openCreate
                            }
                        >
                            <Plus size={17} />
                            Добавить материал
                        </button>
                    </div>
                )}
            </div>

            <section className="stats-grid">
                <MaterialStat
                    icon={
                        <Package />
                    }
                    value={
                        materials.length
                    }
                    label="Всего позиций"
                />

                <MaterialStat
                    icon={
                        <CheckCircle2 />
                    }
                    value={
                        activeMaterials
                    }
                    label="Активных"
                />

                <MaterialStat
                    icon={
                        <RefreshCcw />
                    }
                    value={
                        belowMinimum
                    }
                    label="Требуют внимания"
                />

                <MaterialStat
                    icon={
                        <Archive />
                    }
                    value={
                        withoutStock
                    }
                    label="Нет в наличии"
                />
            </section>

            {error &&
                !formOpen && (
                    <div
                        style={
                            styles.errorBox
                        }
                    >
                        {error}
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
                            size={18}
                        />

                        <input
                            value={
                                search
                            }
                            onChange={(
                                event,
                            ) => {
                                setSearch(
                                    event
                                        .target
                                        .value,
                                );
                                setOrderMode(false);
                            }}
                            placeholder="Поиск..."
                            style={
                                styles.searchInput
                            }
                        />
                    </div>

                    <select
                        value={
                            categoryFilter
                        }
                        onChange={(
                            event,
                        ) => {
                            setCategoryFilter(
                                event
                                    .target
                                    .value,
                            );
                            setOrderMode(false);
                        }}
                        style={
                            styles.select
                        }
                    >
                        <option value="all">
                            Все категории
                        </option>

                        {categories.map(
                            (category) => (
                                <option
                                    key={
                                        category.id
                                    }
                                    value={
                                        category.id
                                    }
                                >
                                    {
                                        category.name
                                    }
                                </option>
                            ),
                        )}
                    </select>

                    <select
                        value={
                            statusFilter
                        }
                        onChange={(
                            event,
                        ) => {
                            setStatusFilter(
                                event
                                    .target
                                    .value,
                            );
                            setOrderMode(false);
                        }}
                        style={
                            styles.select
                        }
                    >
                        <option value="all">
                            Все статусы
                        </option>

                        <option value="active">
                            Активные
                        </option>

                        <option value="low">
                            Низкий остаток
                        </option>

                        <option value="empty">
                            Нет в наличии
                        </option>

                        <option value="archived">
                            Архив
                        </option>
                    </select>

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
            </section>

            <section className="panel" style={{ marginTop: 18 }}>
                <div style={styles.sectionHeader}>
                    <div>
                        <p className="eyebrow">INK</p>
                        <h2>Краска</h2>
                        <p style={styles.sectionSubtitle}>Остатки по станкам, цветам и фасовке 1 / 5 л.</p>
                    </div>
                    {access.canManageMaterials && (
                        <button type="button" className="button primary" onClick={openCreateInk}>
                            <Plus size={17} /> Добавить краску
                        </button>
                    )}
                </div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Станок</th><th>Цвет</th><th>Фасовка</th><th>Остаток</th><th>Минимум</th></tr></thead>
                        <tbody>
                            {inkMaterials.map((material) => (
                                <tr key={material.id} className={access.canManageMaterials ? 'clickable-row' : undefined} onClick={() => access.canManageMaterials && openEdit(material)}>
                                    <td className="primary-cell">{material.machineName || 'Без станка'}<small className="table-subtitle">{material.article}</small></td>
                                    <td><span style={{ ...styles.colorSwatch, display: 'inline-block', marginRight: 8, background: material.colorHex || '#808080' }} />{material.colorName}</td>
                                    <td>{numberFormatter.format(material.packageLiters ?? 0)} л</td>
                                    <td><strong>{numberFormatter.format(material.currentQuantity)} л</strong></td>
                                    <td>{numberFormatter.format(material.minimumQuantity)} л</td>
                                </tr>
                            ))}
                            {!loading && inkMaterials.length === 0 && <tr><td colSpan={5}>Краска пока не добавлена.</td></tr>}
                        </tbody>
                    </table>
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
                            MAIN WAREHOUSE
                        </p>

                        <h2>
                            Обычные материалы
                        </h2>

                        <p
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            Материалы объединены по типу и разделены по ширинам.
                        </p>
                    </div>

                    <div
                        style={
                            styles.groupHeaderActions
                        }
                    >
                        <button
                            type="button"
                            className={orderMode ? 'button primary' : 'button secondary'}
                            disabled={!reorderingAvailable || saving}
                            title={!reorderingAvailable ? 'Сбросьте поиск и фильтры, чтобы изменить порядок.' : undefined}
                            onClick={() => {
                                setOrderMode(value => !value);
                                setDraggedGroupKey(null);
                                setDraggedOracalKey(null);
                            }}
                        >
                            {orderMode ? <Lock size={16} /> : <Unlock size={16} />}
                            {orderMode ? 'Завершить порядок' : 'Изменить порядок'}
                        </button>

                        <button
                            type="button"
                            className="button secondary"
                            onClick={
                                expandAllGroups
                            }
                        >
                            Развернуть всё
                        </button>

                        <button
                            type="button"
                            className="button secondary"
                            onClick={
                                collapseAllGroups
                            }
                        >
                            Свернуть всё
                        </button>
                    </div>
                </div>

                <div
                    style={
                        styles.groupsContainer
                    }
                >
                    {standardGroups.map(
                        (group) => (
                            <StandardMaterialGroupCard
                                key={
                                    group.key
                                }
                                group={
                                    group
                                }
                                expanded={
                                    expandedGroups.has(
                                        group.key,
                                    )
                                }
                                onToggle={() =>
                                    toggleGroup(
                                        group.key,
                                    )
                                }
                                onEdit={
                                    access.canManageMaterials
                                        ? openEdit
                                        : undefined
                                }
                                orderMode={orderMode}
                                onDragStart={() => setDraggedGroupKey(group.key)}
                                onDrop={() => void reorderStandardGroup(group.key)}
                            />
                        ),
                    )}

                    {!loading &&
                        standardGroups.length ===
                        0 && (
                            <div
                                style={
                                    styles.emptyState
                                }
                            >
                                Материалы не найдены.
                            </div>
                        )}
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
                            PLOTTER MATERIAL
                        </p>

                        <h2>
                            ORACAL 641
                        </h2>

                        <p
                            style={
                                styles.sectionSubtitle
                            }
                        >
                            Учёт по цветам и ширинам 1,00 / 1,27 м.
                        </p>
                    </div>

                    {access.canManageMaterials && (
                        <button
                            type="button"
                            className="button primary"
                            onClick={
                                openCreateOracal
                            }
                        >
                            <Plus size={17} />
                            Добавить цвет
                        </button>
                    )}
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th aria-label="Порядок" />
                                <th>
                                    Цвет
                                </th>

                                <th>
                                    Код / название
                                </th>

                                <th>
                                    1,00 м
                                </th>

                                <th>
                                    1,27 м
                                </th>

                                <th>
                                    Всего
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {oracalRows.map(
                                (row) => {
                                    const total =
                                        (
                                            row.width100
                                                ?.currentQuantity ??
                                            0
                                        ) +
                                        (
                                            row.width127
                                                ?.currentQuantity ??
                                            0
                                        );

                                    return (
                                        <tr
                                            key={row.key}
                                            draggable={orderMode}
                                            onDragStart={() => setDraggedOracalKey(row.key)}
                                            onDragOver={(event) => orderMode && event.preventDefault()}
                                            onDrop={() => void reorderOracalRow(row.key)}
                                        >
                                            <td className={orderMode ? 'drag-cell' : undefined}>
                                                {orderMode ? <GripVertical size={17} /> : <Lock size={14} />}
                                            </td>
                                            <td>
                                                <div
                                                    style={{
                                                        ...styles.colorSwatch,

                                                        background:
                                                            row.hex,
                                                    }}
                                                />
                                            </td>

                                            <td>
                                                <strong>
                                                    {
                                                        row.code
                                                    }
                                                </strong>

                                                {' '}

                                                {
                                                    row.name
                                                }
                                            </td>

                                            <td>
                                                <OracalQuantityCell
                                                    material={
                                                        row.width100
                                                    }
                                                    onEdit={
                                                        access.canManageMaterials
                                                            ? openEdit
                                                            : undefined
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <OracalQuantityCell
                                                    material={
                                                        row.width127
                                                    }
                                                    onEdit={
                                                        access.canManageMaterials
                                                            ? openEdit
                                                            : undefined
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <strong>
                                                    {numberFormatter.format(
                                                        total,
                                                    )}{' '}
                                                    м
                                                </strong>
                                            </td>
                                        </tr>
                                    );
                                },
                            )}

                            {!loading &&
                                oracalRows.length ===
                                0 && (
                                    <tr>
                                        <td colSpan={6}>
                                            ORACAL пока не добавлен.
                                        </td>
                                    </tr>
                                )}
                        </tbody>
                    </table>
                </div>
            </section>

            {access.canManageMaterials && formOpen && (
                <div
                    style={
                        styles.overlay
                    }
                >
                    <form
                        onSubmit={
                            handleSubmit
                        }
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
                                    {form.kind ===
                                        'Oracal641'
                                        ? 'ORACAL 641'
                                        : 'MATERIAL'}
                                </p>

                                <h2>
                                    {editing
                                        ? 'Редактирование'
                                        : form.kind ===
                                            'Oracal641'
                                            ? 'Добавить ORACAL'
                                            : 'Новая группа материалов'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                style={
                                    styles.closeButton
                                }
                                onClick={
                                    closeForm
                                }
                            >
                                <X
                                    size={20}
                                />
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

                        {!editing && (
                            <div
                                style={
                                    styles.kindSelector
                                }
                            >
                                <button
                                    type="button"
                                    style={{
                                        ...styles.kindButton,

                                        ...(form.kind ===
                                            'Standard'
                                            ? styles.kindButtonActive
                                            : {}),
                                    }}
                                    onClick={() => {
                                        setForm(
                                            (current) => ({
                                                ...current,
                                                kind:
                                                    'Standard',
                                            }),
                                        );

                                        applyPreset(
                                            'banner',
                                        );
                                    }}
                                >
                                    <Package
                                        size={18}
                                    />

                                    Обычный материал
                                </button>

                                <button
                                    type="button"
                                    style={{
                                        ...styles.kindButton,

                                        ...(form.kind ===
                                            'Oracal641'
                                            ? styles.kindButtonActive
                                            : {}),
                                    }}
                                    onClick={() => {
                                        const first =
                                            oracalPalette[0];

                                        setForm(
                                            (current) => ({
                                                ...current,

                                                kind:
                                                    'Oracal641',

                                                widthMeters:
                                                    '1',

                                                colorCode:
                                                    first.code,

                                                colorName:
                                                    first.name,

                                                colorHex:
                                                    first.hex,
                                            }),
                                        );
                                    }}
                                >
                                    <Palette
                                        size={18}
                                    />

                                    ORACAL 641
                                </button>

                                <button
                                    type="button"
                                    style={{
                                        ...styles.kindButton,
                                        ...(form.kind === 'Ink' ? styles.kindButtonActive : {}),
                                    }}
                                    onClick={() => {
                                        const first = inkColors[0];
                                        const inkCategory = categories.find((category) =>
                                            category.isActive && category.name.toLowerCase() === 'краска');
                                        setForm((current) => ({
                                            ...current,
                                            kind: 'Ink',
                                            categoryId: inkCategory?.id ?? current.categoryId,
                                            colorCode: first.name,
                                            colorName: first.name,
                                            colorHex: first.hex,
                                            machineName: defaultMachines[0],
                                            packageLiters: '1',
                                        }));
                                    }}
                                >
                                    <Droplets size={18} />
                                    Краска
                                </button>
                            </div>
                        )}

                        <div
                            style={
                                styles.formGrid
                            }
                        >
                            <label
                                style={
                                    styles.field
                                }
                            >
                                <span>
                                    Категория
                                </span>

                                <select
                                    value={
                                        form.categoryId
                                    }
                                    onChange={(event) => {
                                        const categoryId = event.target.value;
                                        const category = categories.find(item => item.id === categoryId);
                                        const film = filmCategoryParts(category?.name ?? '');
                                        setForm((current) => ({
                                            ...current,
                                            categoryId,
                                            filmBase: film.base,
                                            filmFinish: film.finish,
                                        }));
                                        if (film.isFilm) setSelectedPreset('film');
                                    }}
                                    style={
                                        styles.input
                                    }
                                >
                                    <option value="">
                                        Выберите категорию
                                    </option>

                                    {categories
                                        .filter(
                                            (category) =>
                                                category.isActive,
                                        )
                                        .map(
                                            (category) => (
                                                <option
                                                    key={
                                                        category.id
                                                    }
                                                    value={
                                                        category.id
                                                    }
                                                >
                                                    {
                                                        category.name
                                                    }
                                                </option>
                                            ),
                                        )}
                                </select>
                            </label>

                            {form.kind ===
                                'Standard' ? (
                                <>
                                    {selectedPreset === 'film' && (
                                        <>
                                            <label style={styles.field}>
                                                <span>Основа плёнки</span>
                                                <select
                                                    value={form.filmBase}
                                                    onChange={(event) => changeFilmType(
                                                        event.target.value as 'White' | 'Transparent',
                                                        form.filmFinish,
                                                    )}
                                                    style={styles.input}
                                                >
                                                    <option value="White">Белая</option>
                                                    <option value="Transparent">Прозрачная</option>
                                                </select>
                                            </label>

                                            <label style={styles.field}>
                                                <span>Поверхность плёнки</span>
                                                <select
                                                    value={form.filmFinish}
                                                    onChange={(event) => changeFilmType(
                                                        form.filmBase,
                                                        event.target.value as 'Matte' | 'Glossy',
                                                    )}
                                                    style={styles.input}
                                                >
                                                    <option value="Matte">Матовая</option>
                                                    <option value="Glossy">Глянцевая</option>
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
                                            Название группы
                                        </span>

                                        <input
                                            value={
                                                form.name
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setForm(
                                                    (current) => ({
                                                        ...current,

                                                        name:
                                                            event
                                                                .target
                                                                .value,
                                                    }),
                                                )
                                            }
                                            placeholder="Баннер 510 г"
                                            style={
                                                styles.input
                                            }
                                        />
                                    </label>

                                    {editing ? (
                                        <>
                                            <label
                                                style={
                                                    styles.field
                                                }
                                            >
                                                <span>
                                                    Артикул
                                                </span>

                                                <input
                                                    value={
                                                        form.article
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setForm(
                                                            (current) => ({
                                                                ...current,

                                                                article:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
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
                                                    Ширина, м
                                                </span>

                                                <input
                                                    value={
                                                        form.widthMeters
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setForm(
                                                            (current) => ({
                                                                ...current,

                                                                widthMeters:
                                                                    event
                                                                        .target
                                                                        .value,
                                                            }),
                                                        )
                                                    }
                                                    style={
                                                        styles.input
                                                    }
                                                />
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
                                                    Префикс артикула
                                                </span>

                                                <input
                                                    value={
                                                        form.articlePrefix
                                                    }
                                                    onChange={(
                                                        event,
                                                    ) =>
                                                        setForm(
                                                            (current) => ({
                                                                ...current,

                                                                articlePrefix:
                                                                    event
                                                                        .target
                                                                        .value
                                                                        .toUpperCase(),
                                                            }),
                                                        )
                                                    }
                                                    placeholder="BANNER-510"
                                                    style={
                                                        styles.input
                                                    }
                                                />

                                                <small
                                                    style={
                                                        styles.helper
                                                    }
                                                >
                                                    Ширина будет добавлена автоматически.
                                                </small>
                                            </label>

                                            <div
                                                style={
                                                    styles.fullWidth
                                                }
                                            >
                                                <span
                                                    style={
                                                        styles.fieldTitle
                                                    }
                                                >
                                                    Набор ширин
                                                </span>

                                                <div
                                                    style={
                                                        styles.presetRow
                                                    }
                                                >
                                                    {widthPresets.map(
                                                        (preset) => (
                                                            <button
                                                                key={
                                                                    preset.id
                                                                }
                                                                type="button"
                                                                style={{
                                                                    ...styles.presetButton,

                                                                    ...(selectedPreset ===
                                                                        preset.id
                                                                        ? styles.presetButtonActive
                                                                        : {}),
                                                                }}
                                                                onClick={() =>
                                                                    applyPreset(
                                                                        preset.id,
                                                                    )
                                                                }
                                                            >
                                                                {
                                                                    preset.name
                                                                }
                                                            </button>
                                                        ),
                                                    )}

                                                    <button
                                                        type="button"
                                                        style={{
                                                            ...styles.presetButton,

                                                            ...(selectedPreset ===
                                                                'custom'
                                                                ? styles.presetButtonActive
                                                                : {}),
                                                        }}
                                                        onClick={() =>
                                                            setSelectedPreset(
                                                                'custom',
                                                            )
                                                        }
                                                    >
                                                        Свои ширины
                                                    </button>
                                                </div>

                                                <div
                                                    style={
                                                        styles.widthSelector
                                                    }
                                                >
                                                    {selectedWidths.map(
                                                        (width) => (
                                                            <button
                                                                key={
                                                                    width
                                                                }
                                                                type="button"
                                                                style={
                                                                    styles.widthChip
                                                                }
                                                                onClick={() =>
                                                                    toggleWidth(
                                                                        width,
                                                                    )
                                                                }
                                                            >
                                                                <Check
                                                                    size={
                                                                        14
                                                                    }
                                                                />

                                                                {formatWidth(
                                                                    width,
                                                                )}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>

                                                <div
                                                    style={
                                                        styles.customWidthRow
                                                    }
                                                >
                                                    <input
                                                        value={
                                                            customWidth
                                                        }
                                                        onChange={(
                                                            event,
                                                        ) =>
                                                            setCustomWidth(
                                                                event
                                                                    .target
                                                                    .value,
                                                            )
                                                        }
                                                        placeholder="Своя ширина, например 1,45"
                                                        style={
                                                            styles.input
                                                        }
                                                    />

                                                    <button
                                                        type="button"
                                                        className="button secondary"
                                                        onClick={
                                                            addCustomWidth
                                                        }
                                                    >
                                                        <Plus
                                                            size={
                                                                16
                                                            }
                                                        />

                                                        Добавить
                                                    </button>
                                                </div>

                                                {selectedWidths.length >
                                                    0 && (
                                                        <div
                                                            style={
                                                                styles.articlePreview
                                                            }
                                                        >
                                                            <div
                                                                style={
                                                                    styles.previewTitle
                                                                }
                                                            >
                                                                Будут созданы:
                                                            </div>

                                                            {selectedWidths.map(
                                                                (width) => (
                                                                    <div
                                                                        key={
                                                                            width
                                                                        }
                                                                        style={
                                                                            styles.previewRow
                                                                        }
                                                                    >
                                                                        <span>
                                                                            {form.name ||
                                                                                'Материал'}
                                                                        </span>

                                                                        <strong>
                                                                            {form.articlePrefix ||
                                                                                'PREFIX'}
                                                                            -
                                                                            {widthToCode(
                                                                                width,
                                                                            )}
                                                                        </strong>
                                                                    </div>
                                                                ),
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : form.kind === 'Ink' ? (
                                <>
                                    <label style={styles.field}>
                                        <span>Станок</span>
                                        <input
                                            list="ink-machine-options"
                                            value={form.machineName}
                                            onChange={(event) => setForm((current) => ({ ...current, machineName: event.target.value }))}
                                            placeholder="Название станка"
                                            style={styles.input}
                                        />
                                        <datalist id="ink-machine-options">
                                            {defaultMachines.map((machine) => <option key={machine} value={machine} />)}
                                        </datalist>
                                        <small style={styles.helper}>Можно ввести новое название станка.</small>
                                    </label>

                                    <label style={styles.field}>
                                        <span>Цвет</span>
                                        <select
                                            value={form.colorName}
                                            onChange={(event) => {
                                                const selected = inkColors.find((color) => color.name === event.target.value) ?? inkColors[0];
                                                setForm((current) => ({ ...current, colorCode: selected.name, colorName: selected.name, colorHex: selected.hex }));
                                            }}
                                            style={styles.input}
                                        >
                                            {inkColors.map((color) => <option key={color.name} value={color.name}>{color.name}</option>)}
                                        </select>
                                    </label>

                                    <label style={styles.field}>
                                        <span>Фасовка</span>
                                        <select value={form.packageLiters} onChange={(event) => setForm((current) => ({ ...current, packageLiters: event.target.value as '1' | '5' }))} style={styles.input}>
                                            <option value="1">1 л</option>
                                            <option value="5">5 л</option>
                                        </select>
                                    </label>

                                    {editing && (
                                        <label style={styles.field}>
                                            <span>Артикул</span>
                                            <input value={form.article} onChange={(event) => setForm((current) => ({ ...current, article: event.target.value }))} style={styles.input} />
                                        </label>
                                    )}
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
                                                form.colorCode
                                            }
                                            onChange={(
                                                event,
                                            ) =>
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
                                            {oracalPalette.map(
                                                (color) => (
                                                    <option
                                                        key={
                                                            color.code
                                                        }
                                                        value={
                                                            color.code
                                                        }
                                                    >
                                                        {
                                                            color.code
                                                        }{' '}
                                                        —{' '}
                                                        {
                                                            color.name
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </label>

                                    <div
                                        style={
                                            styles.colorPreview
                                        }
                                    >
                                        <div
                                            style={{
                                                ...styles.largeColorSwatch,

                                                background:
                                                    form.colorHex,
                                            }}
                                        />

                                        <strong>
                                            {
                                                form.colorCode
                                            }{' '}
                                            {
                                                form.colorName
                                            }
                                        </strong>
                                    </div>

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
                                                form.widthMeters
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setForm(
                                                    (current) => ({
                                                        ...current,

                                                        widthMeters:
                                                            event
                                                                .target
                                                                .value,
                                                    }),
                                                )
                                            }
                                            style={
                                                styles.input
                                            }
                                        >
                                            <option value="1">
                                                1,00 м
                                            </option>

                                            <option value="1.27">
                                                1,27 м
                                            </option>
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
                                    Минимальный остаток
                                </span>

                                <input
                                    type="number"
                                    min="0"
                                    step={
                                        form.kind === 'Standard'
                                            ? '1'
                                            : form.kind === 'Ink'
                                                ? '0.1'
                                                : '0.01'
                                    }
                                    value={
                                        form.minimumQuantity
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setForm(
                                            (current) => ({
                                                ...current,

                                                minimumQuantity:
                                                    event
                                                        .target
                                                        .value,
                                            }),
                                        )
                                    }
                                    style={
                                        styles.input
                                    }
                                />
                            </label>
                        </div>

                        <div
                            style={
                                styles.modalFooter
                            }
                        >
                            {editing && ((form.isActive && access.canArchiveMaterials) || (!form.isActive && access.canRestoreMaterials)) && (
                                <button
                                    type="button"
                                    className="button secondary"
                                    onClick={() => {
                                        const material =
                                            materials.find(
                                                (item) =>
                                                    item.id ===
                                                    form.id,
                                            );

                                        if (
                                            material
                                        ) {
                                            changeActivity(
                                                material,
                                            );
                                        }
                                    }}
                                >
                                    {form.isActive
                                        ? 'В архив'
                                        : 'Восстановить'}
                                </button>
                            )}

                            {editing && !form.isActive && access.canPermanentlyDeleteMaterials && (
                                <button
                                    type="button"
                                    className="button danger"
                                    onClick={() => {
                                        const material = materials.find((item) => item.id === form.id);
                                        if (material) void deletePermanently(material);
                                    }}
                                >
                                    Удалить безвозвратно
                                </button>
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
                                    closeForm
                                }
                            >
                                Отмена
                            </button>

                            <button
                                type="submit"
                                className="button primary"
                                disabled={
                                    saving
                                }
                            >
                                {saving
                                    ? 'Сохранение...'
                                    : !editing &&
                                        form.kind ===
                                        'Standard'
                                        ? `Создать ${selectedWidths.length} позиций`
                                        : editing
                                            ? 'Сохранить'
                                            : 'Добавить'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

function StandardMaterialGroupCard({
    group,
    expanded,
    onToggle,
    onEdit,
    orderMode,
    onDragStart,
    onDrop,
}: {
    group: StandardMaterialGroup;
    expanded: boolean;
    onToggle: () => void;
    onEdit?: (
        material: MaterialCatalogItem,
    ) => void;
    orderMode: boolean;
    onDragStart: () => void;
    onDrop: () => void;
}) {
    return (
        <div
            style={{
                ...styles.groupCard,
                ...(orderMode ? styles.groupCardSorting : {}),
            }}
            draggable={orderMode}
            onDragStart={onDragStart}
            onDragOver={(event) => orderMode && event.preventDefault()}
            onDrop={onDrop}
        >
            <button
                type="button"
                style={
                    styles.groupSummary
                }
                onClick={
                    onToggle
                }
            >
                {orderMode && <GripVertical size={18} />}
                {expanded ? (
                    <ChevronDown
                        size={20}
                    />
                ) : (
                    <ChevronRight
                        size={20}
                    />
                )}

                <div
                    style={{
                        flex:
                            1,
                    }}
                >
                    <strong>
                        {
                            group.name
                        }
                    </strong>

                    <div
                        style={
                            styles.helper
                        }
                    >
                        {
                            group.categoryName
                        }{' '}
                        ·{' '}
                        {
                            group.materials.length
                        }{' '}
                        ширин
                    </div>
                </div>

                <strong>
                    {numberFormatter.format(
                        group.totalQuantity,
                    )}{' '}
                    шт.
                </strong>
            </button>

            {expanded && (
                <div
                    style={
                        styles.widthGrid
                    }
                >
                    {group.materials.map(
                        (material) => (
                            <div
                                key={
                                    material.id
                                }
                                style={
                                    styles.widthCard
                                }
                            >
                                <div>
                                    <strong
                                        style={
                                            styles.widthValue
                                        }
                                    >
                                        {material.widthMeters
                                            ? formatWidth(
                                                material.widthMeters,
                                            )
                                            : 'Без ширины'}
                                    </strong>

                                    {filmMarkerText(material.categoryName) && (
                                        <span style={styles.filmMarker}>
                                            {filmMarkerText(material.categoryName)}
                                        </span>
                                    )}

                                    <div
                                        style={
                                            styles.helper
                                        }
                                    >
                                        {
                                            material.article
                                        }
                                    </div>
                                </div>

                                <div>
                                    {numberFormatter.format(
                                        material.currentQuantity,
                                    )}{' '}
                                    шт.
                                </div>

                                {onEdit && (
                                    <button
                                        type="button"
                                        style={
                                            styles.iconButton
                                        }
                                        onClick={() =>
                                            onEdit(material)
                                        }
                                    >
                                        <Edit3 size={16} />
                                    </button>
                                )}
                            </div>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

function OracalQuantityCell({
    material,
    onEdit,
}: {
    material?: MaterialCatalogItem;
    onEdit?: (
        material: MaterialCatalogItem,
    ) => void;
}) {
    if (!material) {
        return <>—</>;
    }

    if (!onEdit) {
        return (
            <strong>
                {numberFormatter.format(material.currentQuantity)} м
            </strong>
        );
    }

    return (
        <button
            type="button"
            style={
                styles.quantityButton
            }
            onClick={() =>
                onEdit(
                    material,
                )
            }
        >
            {numberFormatter.format(
                material.currentQuantity,
            )}{' '}
            м
        </button>
    );
}

function MaterialStat({
    icon,
    value,
    label,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
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

function widthToCode(
    width: number,
) {
    return Math.round(
        width * 100,
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

function slug(value: string) {
    return value
        .trim()
        .toUpperCase()
        .replace(/[^A-ZА-ЯЁ0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

const styles: Record<
    string,
    CSSProperties
> = {
    headingActions: {
        display:
            'flex',
        gap:
            10,
    },

    toolbar: {
        display:
            'flex',
        gap:
            10,
        padding:
            16,
        flexWrap:
            'wrap',
    },

    searchBox: {
        flex:
            1,
        display:
            'flex',
        alignItems:
            'center',
        gap:
            10,
        border:
            '1px solid #283341',
        borderRadius:
            10,
        padding:
            '0 12px',
        background:
            '#111922',
    },

    searchInput: {
        flex:
            1,
        border:
            0,
        outline:
            0,
        background:
            'transparent',
        color:
            '#fff',
        minHeight:
            40,
    },

    select: {
        border:
            '1px solid #283341',
        borderRadius:
            10,
        background:
            '#111922',
        color:
            '#fff',
        padding:
            '0 12px',
    },

    sectionHeader: {
        display:
            'flex',
        justifyContent:
            'space-between',
        gap:
            16,
        alignItems:
            'center',
        padding:
            18,
        borderBottom:
            '1px solid rgba(255,255,255,.06)',
    },

    groupHeaderActions: {
        display:
            'flex',
        gap:
            8,
    },

    sectionSubtitle: {
        color:
            '#7f8d9d',
        fontSize:
            12,
    },

    groupsContainer: {
        display:
            'grid',
        gap:
            10,
        padding:
            14,
    },

    groupCard: {
        border:
            '1px solid #26313d',
        borderRadius:
            12,
        overflow:
            'hidden',
    },

    groupCardSorting: {
        borderColor: '#4a94ff',
        cursor: 'grab',
        boxShadow: '0 0 0 2px rgba(74,148,255,.08)',
    },

    groupSummary: {
        width:
            '100%',
        display:
            'flex',
        gap:
            12,
        alignItems:
            'center',
        padding:
            15,
        border:
            0,
        background:
            '#10171f',
        color:
            '#fff',
        cursor:
            'pointer',
        textAlign:
            'left',
    },

    widthGrid: {
        display:
            'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(210px, 1fr))',
        gap:
            10,
        padding:
            12,
    },

    widthCard: {
        display:
            'flex',
        alignItems:
            'center',
        justifyContent:
            'space-between',
        gap:
            10,
        padding:
            12,
        borderRadius:
            10,
        background:
            '#141d27',
        border:
            '1px solid #293542',
    },

    widthValue: {
        fontSize:
            18,
    },

    filmMarker: {
        display:
            'inline-flex',
        marginLeft:
            7,
        padding:
            '2px 6px',
        border:
            '1px solid rgba(74,166,255,.35)',
        borderRadius:
            6,
        color:
            '#93c5fd',
        fontSize:
            10,
        fontWeight:
            900,
    },

    colorSwatch: {
        width:
            30,
        height:
            30,
        borderRadius:
            7,
        border:
            '1px solid rgba(255,255,255,.25)',
    },

    largeColorSwatch: {
        width:
            50,
        height:
            50,
        borderRadius:
            10,
        border:
            '1px solid rgba(255,255,255,.25)',
    },

    quantityButton: {
        border:
            '1px solid #293542',
        background:
            '#141d27',
        color:
            '#fff',
        borderRadius:
            8,
        padding:
            '7px 10px',
        cursor:
            'pointer',
    },

    iconButton: {
        width:
            34,
        height:
            34,
        display:
            'grid',
        placeItems:
            'center',
        border:
            '1px solid #293542',
        background:
            '#141d27',
        color:
            '#fff',
        borderRadius:
            8,
        cursor:
            'pointer',
    },

    overlay: {
        position:
            'fixed',
        inset:
            0,
        display:
            'grid',
        placeItems:
            'center',
        background:
            'rgba(0,0,0,.75)',
        zIndex:
            1000,
        padding:
            20,
    },

    modal: {
        width:
            'min(780px, 96vw)',
        maxHeight:
            '92vh',
        overflowY:
            'auto',
        background:
            '#111a2a',
        border:
            '1px solid #273446',
        borderRadius:
            18,
        padding:
            24,
    },

    modalHeader: {
        display:
            'flex',
        justifyContent:
            'space-between',
        alignItems:
            'center',
        marginBottom:
            20,
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
            '#1b2532',
        color:
            '#fff',
        cursor:
            'pointer',
    },

    kindSelector: {
        display:
            'grid',
        gridTemplateColumns:
            '1fr 1fr',
        gap:
            10,
        marginBottom:
            20,
    },

    kindButton: {
        minHeight:
            50,
        border:
            '1px solid #2d3949',
        background:
            '#151f2c',
        color:
            '#9caabd',
        borderRadius:
            10,
        cursor:
            'pointer',
    },

    kindButtonActive: {
        border:
            '1px solid #3b82f6',
        color:
            '#fff',
        background:
            'rgba(59,130,246,.12)',
    },

    formGrid: {
        display:
            'grid',
        gridTemplateColumns:
            'repeat(2, minmax(0, 1fr))',
        gap:
            16,
    },

    field: {
        display:
            'grid',
        gap:
            7,
        fontSize:
            13,
        fontWeight:
            700,
    },

    fieldTitle: {
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
            '#1a2332',
        color:
            '#fff',
        padding:
            '10px 12px',
    },

    fullWidth: {
        gridColumn:
            '1 / -1',
        display:
            'grid',
        gap:
            12,
    },

    presetRow: {
        display:
            'flex',
        gap:
            8,
        flexWrap:
            'wrap',
    },

    presetButton: {
        border:
            '1px solid #303b4a',
        borderRadius:
            9,
        background:
            '#151e29',
        color:
            '#9caabd',
        padding:
            '9px 14px',
        cursor:
            'pointer',
    },

    presetButtonActive: {
        border:
            '1px solid #3b82f6',
        background:
            'rgba(59,130,246,.12)',
        color:
            '#fff',
    },

    widthSelector: {
        display:
            'flex',
        gap:
            8,
        flexWrap:
            'wrap',
    },

    widthChip: {
        display:
            'flex',
        alignItems:
            'center',
        gap:
            6,
        border:
            '1px solid rgba(59,130,246,.35)',
        borderRadius:
            999,
        background:
            'rgba(59,130,246,.10)',
        color:
            '#bfdbfe',
        padding:
            '7px 11px',
        cursor:
            'pointer',
    },

    customWidthRow: {
        display:
            'grid',
        gridTemplateColumns:
            '1fr auto',
        gap:
            8,
    },

    articlePreview: {
        display:
            'grid',
        gap:
            6,
        padding:
            12,
        border:
            '1px solid #293542',
        borderRadius:
            10,
        background:
            '#101820',
    },

    previewTitle: {
        fontWeight:
            700,
        marginBottom:
            4,
    },

    previewRow: {
        display:
            'flex',
        justifyContent:
            'space-between',
        gap:
            12,
        color:
            '#9caabd',
        fontSize:
            12,
    },

    colorPreview: {
        display:
            'flex',
        alignItems:
            'center',
        gap:
            12,
    },

    modalFooter: {
        display:
            'flex',
        gap:
            10,
        marginTop:
            24,
    },

    helper: {
        color:
            '#77879a',
        fontSize:
            11,
    },

    errorBox: {
        padding:
            12,
        marginBottom:
            16,
        borderRadius:
            9,
        background:
            'rgba(127,29,29,.2)',
        color:
            '#fca5a5',
    },

    emptyState: {
        padding:
            30,
        textAlign:
            'center',
        color:
            '#718096',
    },
};

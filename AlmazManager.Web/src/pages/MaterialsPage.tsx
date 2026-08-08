import {
    useEffect,
    useMemo,
    useState,
    type FormEvent,
} from 'react';

import {
    Archive,
    CheckCircle2,
    Edit3,
    Package,
    Plus,
    RefreshCcw,
    RotateCcw,
    Search,
    X,
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
};

type MaterialCatalogResponse = {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    items: MaterialCatalogItem[];
};

type Category = {
    id: string;
    name: string;
    isActive: boolean;
};

type MaterialForm = {
    id?: string;
    name: string;
    article: string;
    categoryId: string;
    unit: string;
    minimumQuantity: string;
    currentQuantity: number;
    isActive: boolean;
};

const emptyForm: MaterialForm = {
    name: '',
    article: '',
    categoryId: '',
    unit: 'Piece',
    minimumQuantity: '0',
    currentQuantity: 0,
    isActive: true,
};

const numberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
});

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<
        MaterialCatalogItem[]
    >([]);

    const [categories, setCategories] = useState<Category[]>([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] =
        useState('all');

    const [statusFilter, setStatusFilter] =
        useState('active');

    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] =
        useState<MaterialForm>(emptyForm);

    const editing = Boolean(form.id);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const [
                materialsResponse,
                categoriesResponse,
            ] = await Promise.all([
                api.get<MaterialCatalogResponse>(
                    '/materials/catalog',
                ),
                api.get<Category[]>('/categories'),
            ]);

            setMaterials(
                materialsResponse.data.items ?? [],
            );

            setCategories(
                categoriesResponse.data ?? [],
            );
        } catch (requestError: any) {
            console.error(
                'Ошибка загрузки материалов:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                'Не удалось загрузить материалы.',
            );
        } finally {
            setLoading(false);
        }
    }

    const categoryMap = useMemo(() => {
        return new Map(
            categories.map((category) => [
                category.id,
                category.name,
            ]),
        );
    }, [categories]);

    const filteredMaterials = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase();

        return materials.filter((material) => {
            const matchesSearch =
                !normalizedSearch ||
                material.name
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                material.article
                    .toLowerCase()
                    .includes(normalizedSearch) ||
                (
                    categoryMap.get(
                        material.categoryId,
                    ) ?? ''
                )
                    .toLowerCase()
                    .includes(normalizedSearch);

            const matchesCategory =
                categoryFilter === 'all' ||
                material.categoryId ===
                categoryFilter;

            let matchesStatus = true;

            if (statusFilter === 'active') {
                matchesStatus = material.isActive;
            }

            if (statusFilter === 'archived') {
                matchesStatus = !material.isActive;
            }

            if (statusFilter === 'low') {
                matchesStatus =
                    material.isActive &&
                    material.belowMinimum &&
                    material.currentQuantity > 0;
            }

            if (statusFilter === 'empty') {
                matchesStatus =
                    material.isActive &&
                    material.currentQuantity <= 0;
            }

            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );
        });
    }, [
        materials,
        search,
        categoryFilter,
        statusFilter,
        categoryMap,
    ]);

    const activeMaterials = materials.filter(
        (material) => material.isActive,
    ).length;

    const belowMinimum = materials.filter(
        (material) =>
            material.isActive &&
            material.belowMinimum,
    ).length;

    const withoutStock = materials.filter(
        (material) =>
            material.isActive &&
            material.currentQuantity <= 0,
    ).length;

    function openCreate() {
        setForm({
            ...emptyForm,
            categoryId:
                categories.find(
                    (category) =>
                        category.isActive,
                )?.id ?? '',
        });

        setError('');
        setFormOpen(true);
    }

    function openEdit(
        material: MaterialCatalogItem,
    ) {
        setForm({
            id: material.id,
            name: material.name,
            article: material.article,
            categoryId: material.categoryId,
            unit: material.unit,
            minimumQuantity:
                material.minimumQuantity.toString(),
            currentQuantity:
                material.currentQuantity,
            isActive: material.isActive,
        });

        setError('');
        setFormOpen(true);
    }

    function closeForm() {
        if (saving) {
            return;
        }

        setFormOpen(false);
        setForm(emptyForm);
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const minimumQuantity =
            Number(form.minimumQuantity);

        if (!form.name.trim()) {
            setError(
                'Введите название материала.',
            );
            return;
        }

        if (!form.article.trim()) {
            setError(
                'Введите артикул материала.',
            );
            return;
        }

        if (!form.categoryId) {
            setError(
                'Выберите категорию.',
            );
            return;
        }

        if (
            Number.isNaN(minimumQuantity) ||
            minimumQuantity < 0
        ) {
            setError(
                'Минимальный остаток должен быть равен нулю или больше.',
            );
            return;
        }

        const payload = {
            name: form.name.trim(),
            article: form.article.trim(),
            categoryId: form.categoryId,
            unit: form.unit,
            minimumQuantity,
        };

        try {
            setSaving(true);
            setError('');

            if (form.id) {
                await api.put(
                    `/materials/${form.id}`,
                    payload,
                );
            } else {
                await api.post(
                    '/materials',
                    payload,
                );
            }

            setFormOpen(false);
            setForm(emptyForm);

            await loadData();
        } catch (requestError: any) {
            console.error(
                'Ошибка сохранения материала:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                requestError?.response?.data?.title ??
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

        const confirmation =
            material.isActive
                ? `Архивировать материал «${material.name}»?`
                : `Восстановить материал «${material.name}»?`;

        if (!window.confirm(confirmation)) {
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
                form.id === material.id
            ) {
                setFormOpen(false);
                setForm(emptyForm);
            }
        } catch (requestError: any) {
            console.error(
                'Ошибка изменения статуса:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                'Не удалось изменить статус материала.',
            );
        }
    }

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        WAREHOUSE
                    </p>

                    <h1>Материалы</h1>

                    <p>
                        Управление материалами,
                        остатками и минимальными
                        значениями.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    style={styles.primaryButton}
                >
                    <Plus size={18} />
                    Добавить материал
                </button>
            </div>

            <section className="stats-grid">
                <MaterialStat
                    icon={<Package />}
                    value={materials.length}
                    label="Всего материалов"
                    tone="blue"
                />

                <MaterialStat
                    icon={<CheckCircle2 />}
                    value={activeMaterials}
                    label="Активных"
                    tone="green"
                />

                <MaterialStat
                    icon={<RefreshCcw />}
                    value={belowMinimum}
                    label="Требуют внимания"
                    tone="amber"
                />

                <MaterialStat
                    icon={<Archive />}
                    value={withoutStock}
                    label="Нет в наличии"
                    tone="red"
                />
            </section>

            {error && !formOpen && (
                <section
                    className="panel"
                    style={{
                        marginBottom: 20,
                    }}
                >
                    <div className="panel-header">
                        <div>
                            <h2>Ошибка</h2>
                            <p>{error}</p>
                        </div>
                    </div>
                </section>
            )}

            <section className="panel">
                <div
                    style={styles.toolbar}
                >
                    <div
                        style={styles.searchBox}
                    >
                        <Search
                            size={18}
                            style={{
                                opacity: 0.6,
                            }}
                        />

                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value,
                                )
                            }
                            placeholder="Поиск по названию, артикулу или категории..."
                            style={styles.searchInput}
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(event) =>
                            setCategoryFilter(
                                event.target.value,
                            )
                        }
                        style={styles.select}
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
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value,
                            )
                        }
                        style={styles.select}
                    >
                        <option value="all">
                            Все материалы
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
                        onClick={loadData}
                        style={styles.iconButton}
                        title="Обновить"
                    >
                        <RefreshCcw size={18} />
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Материал</th>
                                <th>Артикул</th>
                                <th>Категория</th>
                                <th>Остаток</th>
                                <th>Минимум</th>
                                <th>Статус</th>
                                <th />
                            </tr>
                        </thead>

                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={7}>
                                        Загрузка
                                        материалов...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filteredMaterials.length ===
                                0 && (
                                    <tr>
                                        <td colSpan={7}>
                                            Материалы не
                                            найдены.
                                        </td>
                                    </tr>
                                )}

                            {!loading &&
                                filteredMaterials.map(
                                    (material) => (
                                        <tr
                                            key={
                                                material.id
                                            }
                                        >
                                            <td className="primary-cell">
                                                {
                                                    material.name
                                                }
                                            </td>

                                            <td>
                                                {
                                                    material.article
                                                }
                                            </td>

                                            <td>
                                                {categoryMap.get(
                                                    material.categoryId,
                                                ) ??
                                                    'Без категории'}
                                            </td>

                                            <td>
                                                <strong>
                                                    {formatQuantity(
                                                        material.currentQuantity,
                                                        material.unit,
                                                    )}
                                                </strong>
                                            </td>

                                            <td>
                                                {formatQuantity(
                                                    material.minimumQuantity,
                                                    material.unit,
                                                )}
                                            </td>

                                            <td>
                                                <MaterialStatus
                                                    material={
                                                        material
                                                    }
                                                />
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        openEdit(
                                                            material,
                                                        )
                                                    }
                                                    style={
                                                        styles.tableButton
                                                    }
                                                    title="Редактировать"
                                                >
                                                    <Edit3
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
                    style={styles.tableFooter}
                >
                    Показано:{' '}
                    <strong>
                        {
                            filteredMaterials.length
                        }
                    </strong>{' '}
                    из{' '}
                    <strong>
                        {materials.length}
                    </strong>
                </div>
            </section>

            {formOpen && (
                <div
                    style={styles.overlay}
                    onMouseDown={(event) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeForm();
                        }
                    }}
                >
                    <section
                        style={styles.modal}
                    >
                        <div
                            style={
                                styles.modalHeader
                            }
                        >
                            <div>
                                <p className="eyebrow">
                                    MATERIAL
                                </p>

                                <h2
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    {editing
                                        ? 'Редактирование материала'
                                        : 'Новый материал'}
                                </h2>
                            </div>

                            <button
                                type="button"
                                onClick={
                                    closeForm
                                }
                                style={
                                    styles.iconButton
                                }
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >
                            <div
                                style={
                                    styles.formGrid
                                }
                            >
                                <FormField
                                    label="Название"
                                    value={
                                        form.name
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        setForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                name: value,
                                            }),
                                        )
                                    }
                                    placeholder="Например: Пленка Oracal 641"
                                />

                                <FormField
                                    label="Артикул"
                                    value={
                                        form.article
                                    }
                                    onChange={(
                                        value,
                                    ) =>
                                        setForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                article:
                                                    value,
                                            }),
                                        )
                                    }
                                    placeholder="ORACAL-641-WHITE"
                                />

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
                                        onChange={(
                                            event,
                                        ) =>
                                            setForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    categoryId:
                                                        event
                                                            .target
                                                            .value,
                                                }),
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                        required
                                    >
                                        <option value="">
                                            Выберите
                                            категорию
                                        </option>

                                        {categories
                                            .filter(
                                                (
                                                    category,
                                                ) =>
                                                    category.isActive ||
                                                    category.id ===
                                                    form.categoryId,
                                            )
                                            .map(
                                                (
                                                    category,
                                                ) => (
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

                                <label
                                    style={
                                        styles.field
                                    }
                                >
                                    <span>
                                        Единица
                                        измерения
                                    </span>

                                    <select
                                        value={
                                            form.unit
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,
                                                    unit: event
                                                        .target
                                                        .value,
                                                }),
                                            )
                                        }
                                        style={
                                            styles.input
                                        }
                                    >
                                        <option value="Piece">
                                            Штуки
                                        </option>

                                        <option value="Meter">
                                            Метры
                                        </option>

                                        <option value="SquareMeter">
                                            Квадратные
                                            метры
                                        </option>

                                        <option value="Kilogram">
                                            Килограммы
                                        </option>

                                        <option value="Liter">
                                            Литры
                                        </option>

                                        <option value="Roll">
                                            Рулоны
                                        </option>

                                        <option value="Sheet">
                                            Листы
                                        </option>
                                    </select>
                                </label>

                                <label
                                    style={
                                        styles.field
                                    }
                                >
                                    <span>
                                        Минимальный
                                        остаток
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={
                                            form.minimumQuantity
                                        }
                                        onChange={(
                                            event,
                                        ) =>
                                            setForm(
                                                (
                                                    current,
                                                ) => ({
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

                                {editing && (
                                    <label
                                        style={
                                            styles.field
                                        }
                                    >
                                        <span>
                                            Текущий
                                            остаток
                                        </span>

                                        <div
                                            style={
                                                styles.readOnlyValue
                                            }
                                        >
                                            {formatQuantity(
                                                form.currentQuantity,
                                                form.unit,
                                            )}

                                            <small>
                                                Изменяется
                                                через
                                                приход,
                                                расход или
                                                инвентаризацию
                                            </small>
                                        </div>
                                    </label>
                                )}
                            </div>

                            {error && (
                                <div
                                    style={
                                        styles.formError
                                    }
                                >
                                    {error}
                                </div>
                            )}

                            <div
                                style={
                                    styles.modalFooter
                                }
                            >
                                <div>
                                    {editing && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const material =
                                                    materials.find(
                                                        (
                                                            item,
                                                        ) =>
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
                                            style={
                                                form.isActive
                                                    ? styles.archiveButton
                                                    : styles.restoreButton
                                            }
                                        >
                                            {form.isActive ? (
                                                <>
                                                    <Archive
                                                        size={
                                                            17
                                                        }
                                                    />
                                                    Архивировать
                                                </>
                                            ) : (
                                                <>
                                                    <RotateCcw
                                                        size={
                                                            17
                                                        }
                                                    />
                                                    Восстановить
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>

                                <div
                                    style={
                                        styles.footerActions
                                    }
                                >
                                    <button
                                        type="button"
                                        onClick={
                                            closeForm
                                        }
                                        style={
                                            styles.secondaryButton
                                        }
                                    >
                                        Отмена
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={
                                            saving
                                        }
                                        style={
                                            styles.primaryButton
                                        }
                                    >
                                        {saving
                                            ? 'Сохранение...'
                                            : editing
                                                ? 'Сохранить'
                                                : 'Создать'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </div>
    );
}

function MaterialStatus({
    material,
}: {
    material: MaterialCatalogItem;
}) {
    if (!material.isActive) {
        return (
            <span className="status status-info">
                <span className="status-dot" />
                Архив
            </span>
        );
    }

    if (material.currentQuantity <= 0) {
        return (
            <span className="status status-danger">
                <span className="status-dot" />
                Нет в наличии
            </span>
        );
    }

    if (material.belowMinimum) {
        return (
            <span className="status status-warning">
                <span className="status-dot" />
                Низкий остаток
            </span>
        );
    }

    return (
        <span className="status status-success">
            <span className="status-dot" />
            В норме
        </span>
    );
}

function MaterialStat({
    icon,
    value,
    label,
    tone,
}: {
    icon: React.ReactNode;
    value: number;
    label: string;
    tone: string;
}) {
    return (
        <article
            className={`stat-card stat-${tone}`}
        >
            <div className="stat-icon">
                {icon}
            </div>

            <div>
                <strong className="stat-value">
                    {value}
                </strong>

                <span className="stat-label">
                    {label}
                </span>

                <small>
                    Данные каталога
                </small>
            </div>
        </article>
    );
}

function FormField({
    label,
    value,
    onChange,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <label style={styles.field}>
            <span>{label}</span>

            <input
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                placeholder={placeholder}
                style={styles.input}
                required
            />
        </label>
    );
}

function formatQuantity(
    quantity: number,
    unit: string,
) {
    return `${numberFormatter.format(
        quantity,
    )} ${getUnitLabel(unit)}`;
}

function getUnitLabel(unit: string) {
    switch (unit) {
        case 'Piece':
            return 'шт.';

        case 'Meter':
            return 'м';

        case 'SquareMeter':
            return 'м²';

        case 'Kilogram':
            return 'кг';

        case 'Liter':
            return 'л';

        case 'Roll':
            return 'рул.';

        case 'Sheet':
            return 'лист.';

        default:
            return unit;
    }
}

const styles: Record<
    string,
    React.CSSProperties
> = {
    toolbar: {
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 18,
    },

    searchBox: {
        flex: '1 1 340px',
        minWidth: 220,
        height: 44,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 14px',
        border: '1px solid rgba(148, 163, 184, 0.14)',
        borderRadius: 12,
        background: 'rgba(15, 23, 42, 0.55)',
    },

    searchInput: {
        width: '100%',
        border: 0,
        outline: 0,
        background: 'transparent',
        color: 'inherit',
        font: 'inherit',
    },

    select: {
        height: 44,
        padding: '0 12px',
        borderRadius: 12,
        border: '1px solid rgba(148, 163, 184, 0.14)',
        background: '#111827',
        color: '#e5e7eb',
        minWidth: 170,
    },

    primaryButton: {
        minHeight: 42,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '0 16px',
        border: 0,
        borderRadius: 11,
        background: '#2563eb',
        color: '#ffffff',
        fontWeight: 700,
        cursor: 'pointer',
    },

    secondaryButton: {
        minHeight: 42,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        borderRadius: 11,
        border: '1px solid rgba(148, 163, 184, 0.18)',
        background: 'rgba(30, 41, 59, 0.65)',
        color: '#e5e7eb',
        cursor: 'pointer',
    },

    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 11,
        border: '1px solid rgba(148, 163, 184, 0.16)',
        background: 'rgba(30, 41, 59, 0.65)',
        color: '#cbd5e1',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    },

    tableButton: {
        width: 36,
        height: 36,
        borderRadius: 9,
        border: '1px solid rgba(148, 163, 184, 0.12)',
        background: 'rgba(30, 41, 59, 0.6)',
        color: '#cbd5e1',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },

    tableFooter: {
        paddingTop: 16,
        fontSize: 13,
        color: '#94a3b8',
    },

    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },

    modal: {
        width: 'min(760px, 100%)',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0f172a',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        borderRadius: 18,
        boxShadow:
            '0 30px 90px rgba(0,0,0,0.45)',
        padding: 24,
    },

    modalHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 20,
        marginBottom: 24,
    },

    formGrid: {
        display: 'grid',
        gridTemplateColumns:
            'repeat(auto-fit, minmax(250px, 1fr))',
        gap: 18,
    },

    field: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        color: '#cbd5e1',
    },

    input: {
        width: '100%',
        height: 44,
        boxSizing: 'border-box',
        padding: '0 12px',
        borderRadius: 10,
        border: '1px solid rgba(148, 163, 184, 0.16)',
        background: '#111827',
        color: '#f8fafc',
        outline: 'none',
        font: 'inherit',
    },

    readOnlyValue: {
        minHeight: 64,
        padding: '11px 12px',
        borderRadius: 10,
        border: '1px solid rgba(148, 163, 184, 0.12)',
        background: 'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 3,
        color: '#f8fafc',
        fontSize: 16,
        fontWeight: 700,
    },

    formError: {
        marginTop: 18,
        padding: 12,
        borderRadius: 10,
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        color: '#fca5a5',
    },

    modalFooter: {
        marginTop: 26,
        paddingTop: 20,
        borderTop:
            '1px solid rgba(148, 163, 184, 0.12)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
    },

    footerActions: {
        display: 'flex',
        gap: 10,
    },

    archiveButton: {
        minHeight: 42,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        borderRadius: 10,
        border: '1px solid rgba(239,68,68,.25)',
        background: 'rgba(239,68,68,.08)',
        color: '#fca5a5',
        cursor: 'pointer',
    },

    restoreButton: {
        minHeight: 42,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 14px',
        borderRadius: 10,
        border: '1px solid rgba(34,197,94,.25)',
        background: 'rgba(34,197,94,.08)',
        color: '#86efac',
        cursor: 'pointer',
    },
};
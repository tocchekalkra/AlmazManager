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
    FolderOpen,
    Plus,
    RefreshCcw,
    RotateCcw,
    Search,
    X,
} from 'lucide-react';

import api from '../api/api';

type Category = {
    id: string;
    name: string;
    isActive: boolean;
};

type Material = {
    id: string;
    name: string;
    article: string;
    categoryId: string;
    minimumQuantity: number;
    unit: string;
    isActive: boolean;
};

type CategoryForm = {
    id?: string;
    name: string;
    isActive: boolean;
};

const emptyForm: CategoryForm = {
    name: '',
    isActive: true,
};

export default function CategoriesPage() {
    const [categories, setCategories] =
        useState<Category[]>([]);

    const [materials, setMaterials] =
        useState<Material[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const [search, setSearch] =
        useState('');

    const [statusFilter, setStatusFilter] =
        useState('active');

    const [formOpen, setFormOpen] =
        useState(false);

    const [form, setForm] =
        useState<CategoryForm>(emptyForm);

    const editing = Boolean(form.id);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            setLoading(true);
            setError('');

            const [
                categoriesResponse,
                materialsResponse,
            ] = await Promise.all([
                api.get<Category[]>(
                    '/categories',
                ),
                api.get<Material[]>(
                    '/materials',
                ),
            ]);

            setCategories(
                categoriesResponse.data ?? [],
            );

            setMaterials(
                materialsResponse.data ?? [],
            );
        } catch (requestError: any) {
            console.error(
                'Ошибка загрузки категорий:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                'Не удалось загрузить категории.',
            );
        } finally {
            setLoading(false);
        }
    }

    const materialCountByCategory =
        useMemo(() => {
            const result =
                new Map<string, number>();

            for (const material of materials) {
                const current =
                    result.get(
                        material.categoryId,
                    ) ?? 0;

                result.set(
                    material.categoryId,
                    current + 1,
                );
            }

            return result;
        }, [materials]);

    const activeMaterialCountByCategory =
        useMemo(() => {
            const result =
                new Map<string, number>();

            for (const material of materials) {
                if (!material.isActive) {
                    continue;
                }

                const current =
                    result.get(
                        material.categoryId,
                    ) ?? 0;

                result.set(
                    material.categoryId,
                    current + 1,
                );
            }

            return result;
        }, [materials]);

    const filteredCategories =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            return categories.filter(
                (category) => {
                    const matchesSearch =
                        !normalizedSearch ||
                        category.name
                            .toLowerCase()
                            .includes(
                                normalizedSearch,
                            );

                    let matchesStatus = true;

                    if (
                        statusFilter ===
                        'active'
                    ) {
                        matchesStatus =
                            category.isActive;
                    }

                    if (
                        statusFilter ===
                        'archived'
                    ) {
                        matchesStatus =
                            !category.isActive;
                    }

                    return (
                        matchesSearch &&
                        matchesStatus
                    );
                },
            );
        }, [
            categories,
            search,
            statusFilter,
        ]);

    const activeCategories =
        categories.filter(
            (category) =>
                category.isActive,
        ).length;

    const archivedCategories =
        categories.filter(
            (category) =>
                !category.isActive,
        ).length;

    const categoriesWithMaterials =
        categories.filter(
            (category) =>
                (
                    materialCountByCategory.get(
                        category.id,
                    ) ?? 0
                ) > 0,
        ).length;

    function openCreate() {
        setForm({
            ...emptyForm,
        });

        setError('');
        setFormOpen(true);
    }

    function openEdit(
        category: Category,
    ) {
        setForm({
            id: category.id,
            name: category.name,
            isActive:
                category.isActive,
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
        setError('');
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        const name =
            form.name.trim();

        if (!name) {
            setError(
                'Введите название категории.',
            );
            return;
        }

        try {
            setSaving(true);
            setError('');

            if (form.id) {
                await api.put(
                    `/categories/${form.id}`,
                    {
                        name,
                    },
                );
            } else {
                await api.post(
                    '/categories',
                    {
                        name,
                    },
                );
            }

            setFormOpen(false);
            setForm(emptyForm);

            await loadData();
        } catch (requestError: any) {
            console.error(
                'Ошибка сохранения категории:',
                requestError,
            );

            setError(
                requestError?.response?.data
                    ?.message ??
                requestError?.response?.data
                    ?.title ??
                'Не удалось сохранить категорию.',
            );
        } finally {
            setSaving(false);
        }
    }

    async function changeActivity(
        category: Category,
    ) {
        const action =
            category.isActive
                ? 'archive'
                : 'restore';

        const materialCount =
            materialCountByCategory.get(
                category.id,
            ) ?? 0;

        const confirmation =
            category.isActive
                ? materialCount > 0
                    ? `В категории «${category.name}» находится материалов: ${materialCount}. Архивировать категорию?`
                    : `Архивировать категорию «${category.name}»?`
                : `Восстановить категорию «${category.name}»?`;

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
                `/categories/${category.id}/${action}`,
            );

            await loadData();

            if (
                formOpen &&
                form.id === category.id
            ) {
                setFormOpen(false);
                setForm(emptyForm);
            }
        } catch (requestError: any) {
            console.error(
                'Ошибка изменения статуса категории:',
                requestError,
            );

            setError(
                requestError?.response?.data
                    ?.message ??
                'Не удалось изменить статус категории.',
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

                    <h1>Категории</h1>

                    <p>
                        Управление группами
                        материалов склада.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openCreate}
                    style={
                        styles.primaryButton
                    }
                >
                    <Plus size={18} />
                    Добавить категорию
                </button>
            </div>

            <section className="stats-grid">
                <CategoryStat
                    icon={<FolderOpen />}
                    value={
                        categories.length
                    }
                    label="Всего категорий"
                    tone="blue"
                />

                <CategoryStat
                    icon={
                        <CheckCircle2 />
                    }
                    value={
                        activeCategories
                    }
                    label="Активных"
                    tone="green"
                />

                <CategoryStat
                    icon={<FolderOpen />}
                    value={
                        categoriesWithMaterials
                    }
                    label="С материалами"
                    tone="amber"
                />

                <CategoryStat
                    icon={<Archive />}
                    value={
                        archivedCategories
                    }
                    label="В архиве"
                    tone="red"
                />
            </section>

            {error &&
                !formOpen && (
                    <section
                        className="panel"
                        style={{
                            marginBottom: 20,
                        }}
                    >
                        <div className="panel-header">
                            <div>
                                <h2>
                                    Ошибка
                                </h2>
                                <p>
                                    {error}
                                </p>
                            </div>
                        </div>
                    </section>
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
                            style={{
                                opacity: 0.6,
                            }}
                        />

                        <input
                            value={search}
                            onChange={(
                                event,
                            ) =>
                                setSearch(
                                    event.target
                                        .value,
                                )
                            }
                            placeholder="Поиск по названию категории..."
                            style={
                                styles.searchInput
                            }
                        />
                    </div>

                    <select
                        value={
                            statusFilter
                        }
                        onChange={(
                            event,
                        ) =>
                            setStatusFilter(
                                event.target
                                    .value,
                            )
                        }
                        style={
                            styles.select
                        }
                    >
                        <option value="all">
                            Все категории
                        </option>

                        <option value="active">
                            Активные
                        </option>

                        <option value="archived">
                            Архив
                        </option>
                    </select>

                    <button
                        type="button"
                        onClick={loadData}
                        style={
                            styles.iconButton
                        }
                        title="Обновить"
                    >
                        <RefreshCcw
                            size={18}
                        />
                    </button>
                </div>

                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    Категория
                                </th>
                                <th>
                                    Всего
                                    материалов
                                </th>
                                <th>
                                    Активных
                                    материалов
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
                                            5
                                        }
                                    >
                                        Загрузка
                                        категорий...
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                filteredCategories.length ===
                                0 && (
                                    <tr>
                                        <td
                                            colSpan={
                                                5
                                            }
                                        >
                                            Категории
                                            не
                                            найдены.
                                        </td>
                                    </tr>
                                )}

                            {!loading &&
                                filteredCategories.map(
                                    (
                                        category,
                                    ) => {
                                        const total =
                                            materialCountByCategory.get(
                                                category.id,
                                            ) ??
                                            0;

                                        const active =
                                            activeMaterialCountByCategory.get(
                                                category.id,
                                            ) ??
                                            0;

                                        return (
                                            <tr
                                                key={
                                                    category.id
                                                }
                                            >
                                                <td className="primary-cell">
                                                    {
                                                        category.name
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        total
                                                    }
                                                </td>

                                                <td>
                                                    {
                                                        active
                                                    }
                                                </td>

                                                <td>
                                                    <CategoryStatus
                                                        category={
                                                            category
                                                        }
                                                    />
                                                </td>

                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            openEdit(
                                                                category,
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
                                        );
                                    },
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
                            filteredCategories.length
                        }
                    </strong>{' '}
                    из{' '}
                    <strong>
                        {
                            categories.length
                        }
                    </strong>
                </div>
            </section>

            {formOpen && (
                <div
                    style={
                        styles.overlay
                    }
                    onMouseDown={(
                        event,
                    ) => {
                        if (
                            event.target ===
                            event.currentTarget
                        ) {
                            closeForm();
                        }
                    }}
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
                                    CATEGORY
                                </p>

                                <h2
                                    style={{
                                        margin: 0,
                                    }}
                                >
                                    {editing
                                        ? 'Редактирование категории'
                                        : 'Новая категория'}
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
                                <X
                                    size={
                                        20
                                    }
                                />
                            </button>
                        </div>

                        <form
                            onSubmit={
                                handleSubmit
                            }
                        >
                            <label
                                style={
                                    styles.field
                                }
                            >
                                <span>
                                    Название
                                    категории
                                </span>

                                <input
                                    value={
                                        form.name
                                    }
                                    onChange={(
                                        event,
                                    ) =>
                                        setForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,
                                                name: event
                                                    .target
                                                    .value,
                                            }),
                                        )
                                    }
                                    placeholder="Например: Плёнки и виниловые материалы"
                                    style={
                                        styles.input
                                    }
                                    required
                                />
                            </label>

                            {editing && (
                                <div
                                    style={
                                        styles.categoryInfo
                                    }
                                >
                                    <span>
                                        Материалов
                                        в категории
                                    </span>

                                    <strong>
                                        {materialCountByCategory.get(
                                            form.id!,
                                        ) ??
                                            0}
                                    </strong>
                                </div>
                            )}

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
                                                const category =
                                                    categories.find(
                                                        (
                                                            item,
                                                        ) =>
                                                            item.id ===
                                                            form.id,
                                                    );

                                                if (
                                                    category
                                                ) {
                                                    changeActivity(
                                                        category,
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

function CategoryStatus({
    category,
}: {
    category: Category;
}) {
    if (!category.isActive) {
        return (
            <span className="status status-info">
                <span className="status-dot" />
                Архив
            </span>
        );
    }

    return (
        <span className="status status-success">
            <span className="status-dot" />
            Активна
        </span>
    );
}

function CategoryStat({
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
        border:
            '1px solid rgba(148, 163, 184, 0.14)',
        borderRadius: 12,
        background:
            'rgba(15, 23, 42, 0.55)',
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
        border:
            '1px solid rgba(148, 163, 184, 0.14)',
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
        border:
            '1px solid rgba(148, 163, 184, 0.18)',
        background:
            'rgba(30, 41, 59, 0.65)',
        color: '#e5e7eb',
        cursor: 'pointer',
    },

    iconButton: {
        width: 42,
        height: 42,
        borderRadius: 11,
        border:
            '1px solid rgba(148, 163, 184, 0.16)',
        background:
            'rgba(30, 41, 59, 0.65)',
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
        border:
            '1px solid rgba(148, 163, 184, 0.12)',
        background:
            'rgba(30, 41, 59, 0.6)',
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
        background:
            'rgba(2, 6, 23, 0.78)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
    },

    modal: {
        width: 'min(600px, 100%)',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0f172a',
        border:
            '1px solid rgba(148, 163, 184, 0.16)',
        borderRadius: 18,
        boxShadow:
            '0 30px 90px rgba(0,0,0,0.45)',
        padding: 24,
    },

    modalHeader: {
        display: 'flex',
        justifyContent:
            'space-between',
        alignItems: 'flex-start',
        gap: 20,
        marginBottom: 24,
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
        border:
            '1px solid rgba(148, 163, 184, 0.16)',
        background: '#111827',
        color: '#f8fafc',
        outline: 'none',
        font: 'inherit',
    },

    categoryInfo: {
        marginTop: 18,
        padding: 14,
        borderRadius: 10,
        border:
            '1px solid rgba(148, 163, 184, 0.12)',
        background:
            'rgba(15, 23, 42, 0.55)',
        display: 'flex',
        justifyContent:
            'space-between',
        gap: 10,
        color: '#cbd5e1',
    },

    formError: {
        marginTop: 18,
        padding: 12,
        borderRadius: 10,
        background:
            'rgba(239, 68, 68, 0.1)',
        border:
            '1px solid rgba(239, 68, 68, 0.2)',
        color: '#fca5a5',
    },

    modalFooter: {
        marginTop: 26,
        paddingTop: 20,
        borderTop:
            '1px solid rgba(148, 163, 184, 0.12)',
        display: 'flex',
        justifyContent:
            'space-between',
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
        border:
            '1px solid rgba(239,68,68,.25)',
        background:
            'rgba(239,68,68,.08)',
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
        border:
            '1px solid rgba(34,197,94,.25)',
        background:
            'rgba(34,197,94,.08)',
        color: '#86efac',
        cursor: 'pointer',
    },
};
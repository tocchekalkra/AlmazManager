import {
    useEffect,
    useMemo,
    useState,
    type CSSProperties,
    type FormEvent,
    type ReactNode,
} from 'react';

import {
    Eye,
    EyeOff,
    KeyRound,
    Plus,
    RefreshCcw,
    Save,
    Search,
    ShieldCheck,
    UserCog,
    Users,
    X,
} from 'lucide-react';

import api from '../api/api';

type UserItem = {
    id: string;
    fullName: string;
    login: string;
    role: string;
    isActive: boolean;
    createdAtUtc: string;
};

type CategoryAccess = {
    categoryId: string;
    categoryName: string;

    canView: boolean;
    canReceive: boolean;
    canIssue: boolean;

    canInventoryStandard: boolean;
    canInventoryOracal: boolean;
};

type CreateUserForm = {
    fullName: string;
    login: string;
    password: string;
    role: string;
};

type PermissionField =
    | 'canView'
    | 'canReceive'
    | 'canIssue'
    | 'canInventoryStandard'
    | 'canInventoryOracal';

const emptyCreateForm: CreateUserForm = {
    fullName: '',
    login: '',
    password: '',
    role: 'Printer',
};

export default function UsersPage() {
    const [users, setUsers] =
        useState<UserItem[]>([]);

    const [loading, setLoading] =
        useState(true);

    const [search, setSearch] =
        useState('');

    const [error, setError] =
        useState('');

    const [success, setSuccess] =
        useState('');

    const [showCreateModal, setShowCreateModal] =
        useState(false);

    const [createForm, setCreateForm] =
        useState<CreateUserForm>(
            emptyCreateForm,
        );

    const [creating, setCreating] =
        useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const [selectedUser, setSelectedUser] =
        useState<UserItem | null>(
            null,
        );

    const [accesses, setAccesses] =
        useState<CategoryAccess[]>([]);

    const [
        loadingAccesses,
        setLoadingAccesses,
    ] =
        useState(false);

    const [
        savingAccesses,
        setSavingAccesses,
    ] =
        useState(false);

    useEffect(() => {
        void loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            setError('');

            const response =
                await api.get<UserItem[]>(
                    '/users',
                );

            setUsers(
                response.data ?? [],
            );
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка загрузки пользователей:',
                requestError,
            );

            setError(
                getApiError(
                    requestError,
                    'Не удалось загрузить пользователей.',
                ),
            );
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers =
        useMemo(() => {
            const query =
                search
                    .trim()
                    .toLowerCase();

            if (!query) {
                return users;
            }

            return users.filter(
                user =>
                    user.fullName
                        .toLowerCase()
                        .includes(query) ||
                    user.login
                        .toLowerCase()
                        .includes(query) ||
                    getRoleLabel(
                        user.role,
                    )
                        .toLowerCase()
                        .includes(query),
            );
        }, [
            users,
            search,
        ]);

    const activeUsers =
        users.filter(
            user =>
                user.isActive,
        ).length;

    const administrators =
        users.filter(
            user =>
                user.role ===
                'Administrator',
        ).length;

    const workers =
        users.filter(
            user =>
                user.role ===
                'Printer' ||
                user.role ===
                'PlotterOperator',
        ).length;

    async function handleCreateUser(
        event:
            FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();

        setError('');
        setSuccess('');

        if (
            !createForm.fullName.trim() ||
            !createForm.login.trim() ||
            !createForm.password.trim()
        ) {
            setError(
                'Заполните имя, логин и пароль.',
            );

            return;
        }

        try {
            setCreating(true);

            await api.post(
                '/users/register',
                {
                    fullName:
                        createForm.fullName.trim(),

                    login:
                        createForm.login.trim(),

                    password:
                        createForm.password,

                    role:
                        createForm.role,
                },
            );

            setShowCreateModal(false);

            setCreateForm(
                emptyCreateForm,
            );

            setShowPassword(
                false,
            );

            setSuccess(
                'Пользователь успешно создан.',
            );

            await loadUsers();
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка создания пользователя:',
                requestError,
            );

            setError(
                getApiError(
                    requestError,
                    'Не удалось создать пользователя.',
                ),
            );
        } finally {
            setCreating(false);
        }
    }

    async function openAccessModal(
        user: UserItem,
    ) {
        setSelectedUser(
            user,
        );

        setAccesses([]);

        setError('');
        setSuccess('');

        if (
            user.role ===
            'Administrator'
        ) {
            return;
        }

        try {
            setLoadingAccesses(
                true,
            );

            const response =
                await api.get<
                    CategoryAccess[]
                >(
                    `/users/${user.id}/category-access`,
                );

            setAccesses(
                response.data ?? [],
            );
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка загрузки прав:',
                requestError,
            );

            setError(
                getApiError(
                    requestError,
                    'Не удалось загрузить права пользователя.',
                ),
            );
        } finally {
            setLoadingAccesses(
                false,
            );
        }
    }

    function closeAccessModal() {
        setSelectedUser(
            null,
        );

        setAccesses([]);
    }

    function updateAccess(
        categoryId: string,
        field: PermissionField,
        value: boolean,
    ) {
        setAccesses(
            current =>
                current.map(
                    access => {
                        if (
                            access.categoryId !==
                            categoryId
                        ) {
                            return access;
                        }

                        /*
                         * Отключение просмотра
                         * автоматически отключает
                         * все рабочие действия.
                         */
                        if (
                            field ===
                            'canView' &&
                            value ===
                            false
                        ) {
                            return {
                                ...access,

                                canView:
                                    false,

                                canReceive:
                                    false,

                                canIssue:
                                    false,

                                canInventoryStandard:
                                    false,

                                canInventoryOracal:
                                    false,
                            };
                        }

                        /*
                         * Любое рабочее право
                         * автоматически включает просмотр.
                         */
                        if (
                            field !==
                            'canView' &&
                            value
                        ) {
                            return {
                                ...access,

                                [field]:
                                    true,

                                canView:
                                    true,
                            };
                        }

                        return {
                            ...access,

                            [field]:
                                value,
                        };
                    },
                ),
        );
    }

    function setAllForCategory(
        categoryId: string,
        value: boolean,
    ) {
        setAccesses(
            current =>
                current.map(
                    access =>
                        access.categoryId ===
                            categoryId
                            ? {
                                ...access,

                                canView:
                                    value,

                                canReceive:
                                    value,

                                canIssue:
                                    value,

                                canInventoryStandard:
                                    value,

                                canInventoryOracal:
                                    value,
                            }
                            : access,
                ),
        );
    }

    function enableEverything() {
        setAccesses(
            current =>
                current.map(
                    access => ({
                        ...access,

                        canView:
                            true,

                        canReceive:
                            true,

                        canIssue:
                            true,

                        canInventoryStandard:
                            true,

                        canInventoryOracal:
                            true,
                    }),
                ),
        );
    }

    function disableEverything() {
        setAccesses(
            current =>
                current.map(
                    access => ({
                        ...access,

                        canView:
                            false,

                        canReceive:
                            false,

                        canIssue:
                            false,

                        canInventoryStandard:
                            false,

                        canInventoryOracal:
                            false,
                    }),
                ),
        );
    }

    async function saveAccesses() {
        if (!selectedUser) {
            return;
        }

        if (
            selectedUser.role ===
            'Administrator'
        ) {
            return;
        }

        try {
            setSavingAccesses(
                true,
            );

            setError('');
            setSuccess('');

            await api.put(
                `/users/${selectedUser.id}/category-access`,
                {
                    accesses:
                        accesses.map(
                            access => ({
                                categoryId:
                                    access.categoryId,

                                canView:
                                    access.canView,

                                canReceive:
                                    access.canReceive,

                                canIssue:
                                    access.canIssue,

                                canInventoryStandard:
                                    access.canInventoryStandard,

                                canInventoryOracal:
                                    access.canInventoryOracal,
                            }),
                        ),
                },
            );

            setSuccess(
                `Права пользователя «${selectedUser.fullName}» сохранены.`,
            );

            closeAccessModal();
        } catch (
        requestError: any
        ) {
            console.error(
                'Ошибка сохранения прав:',
                requestError,
            );

            setError(
                getApiError(
                    requestError,
                    'Не удалось сохранить права пользователя.',
                ),
            );
        } finally {
            setSavingAccesses(
                false,
            );
        }
    }

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        SYSTEM
                    </p>

                    <h1>
                        Пользователи
                    </h1>

                    <p>
                        Управление
                        пользователями,
                        ролями и правами
                        доступа.
                    </p>
                </div>

                <div
                    style={
                        styles.headingActions
                    }
                >
                    <button
                        type="button"
                        className="button secondary"
                        onClick={
                            loadUsers
                        }
                        disabled={
                            loading
                        }
                    >
                        <RefreshCcw
                            size={17}
                        />

                        Обновить
                    </button>

                    <button
                        type="button"
                        className="button primary"
                        onClick={() => {
                            setCreateForm(
                                emptyCreateForm,
                            );

                            setShowPassword(
                                false,
                            );

                            setShowCreateModal(
                                true,
                            );
                        }}
                    >
                        <Plus
                            size={17}
                        />

                        Добавить пользователя
                    </button>
                </div>
            </div>

            {error && (
                <Message
                    type="error"
                >
                    {error}
                </Message>
            )}

            {success && (
                <Message
                    type="success"
                >
                    {success}
                </Message>
            )}

            <section
                style={
                    styles.statsGrid
                }
            >
                <StatCard
                    icon={
                        <Users
                            size={20}
                        />
                    }
                    label="Всего пользователей"
                    value={
                        users.length
                    }
                />

                <StatCard
                    icon={
                        <ShieldCheck
                            size={20}
                        />
                    }
                    label="Активных"
                    value={
                        activeUsers
                    }
                />

                <StatCard
                    icon={
                        <KeyRound
                            size={20}
                        />
                    }
                    label="Администраторов"
                    value={
                        administrators
                    }
                />

                <StatCard
                    icon={
                        <UserCog
                            size={20}
                        />
                    }
                    label="Сотрудников"
                    value={
                        workers
                    }
                />
            </section>

            <section className="panel">
                <div
                    style={
                        styles.toolbar
                    }
                >
                    <div>
                        <h2
                            style={{
                                margin:
                                    0,
                            }}
                        >
                            Пользователи системы
                        </h2>

                        <p
                            style={
                                styles.helper
                            }
                        >
                            Права назначаются
                            отдельно для каждой
                            категории материалов.
                        </p>
                    </div>

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
                            placeholder="Поиск по имени, логину или роли"
                            style={
                                styles.searchInput
                            }
                        />
                    </div>
                </div>

                {loading ? (
                    <div
                        style={
                            styles.empty
                        }
                    >
                        Загрузка пользователей...
                    </div>
                ) : filteredUsers.length ===
                    0 ? (
                    <div
                        style={
                            styles.empty
                        }
                    >
                        Пользователи не найдены.
                    </div>
                ) : (
                    <div
                        style={
                            styles.tableScroll
                        }
                    >
                        <table
                            style={
                                styles.table
                            }
                        >
                            <thead>
                                <tr>
                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Пользователь
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Логин
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Роль
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Статус
                                    </th>

                                    <th
                                        style={
                                            styles.th
                                        }
                                    >
                                        Создан
                                    </th>

                                    <th
                                        style={{
                                            ...styles.th,

                                            textAlign:
                                                'right',
                                        }}
                                    >
                                        Действия
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredUsers.map(
                                    user => (
                                        <tr
                                            key={
                                                user.id
                                            }
                                        >
                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                <strong>
                                                    {
                                                        user.fullName
                                                    }
                                                </strong>
                                            </td>

                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                @
                                                {
                                                    user.login
                                                }
                                            </td>

                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                <span
                                                    style={
                                                        styles.roleBadge
                                                    }
                                                >
                                                    {getRoleLabel(
                                                        user.role,
                                                    )}
                                                </span>
                                            </td>

                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                <span
                                                    style={
                                                        user.isActive
                                                            ? styles.activeBadge
                                                            : styles.inactiveBadge
                                                    }
                                                >
                                                    {user.isActive
                                                        ? 'Активен'
                                                        : 'Архив'}
                                                </span>
                                            </td>

                                            <td
                                                style={
                                                    styles.td
                                                }
                                            >
                                                {formatDate(
                                                    user.createdAtUtc,
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...styles.td,

                                                    textAlign:
                                                        'right',
                                                }}
                                            >
                                                <button
                                                    type="button"
                                                    className="button secondary"
                                                    onClick={() =>
                                                        openAccessModal(
                                                            user,
                                                        )
                                                    }
                                                >
                                                    <ShieldCheck
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    Права
                                                </button>
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {showCreateModal && (
                <Modal
                    onClose={() =>
                        setShowCreateModal(
                            false,
                        )
                    }
                >
                    <form
                        onSubmit={
                            handleCreateUser
                        }
                        style={
                            styles.modal
                        }
                    >
                        <ModalHeader
                            title="Новый пользователь"
                            onClose={() =>
                                setShowCreateModal(
                                    false,
                                )
                            }
                        />

                        <div
                            style={
                                styles.formGrid
                            }
                        >
                            <Field
                                label="ФИО / имя"
                                value={
                                    createForm.fullName
                                }
                                placeholder="Например: Иван Петров"
                                onChange={
                                    value =>
                                        setCreateForm(
                                            current => ({
                                                ...current,

                                                fullName:
                                                    value,
                                            }),
                                        )
                                }
                            />

                            <Field
                                label="Логин"
                                value={
                                    createForm.login
                                }
                                placeholder="Например: ivan"
                                onChange={
                                    value =>
                                        setCreateForm(
                                            current => ({
                                                ...current,

                                                login:
                                                    value,
                                            }),
                                        )
                                }
                            />

                            <label
                                style={
                                    styles.field
                                }
                            >
                                <span>
                                    Пароль
                                </span>

                                <div
                                    style={
                                        styles.passwordBox
                                    }
                                >
                                    <input
                                        type={
                                            showPassword
                                                ? 'text'
                                                : 'password'
                                        }
                                        value={
                                            createForm.password
                                        }
                                        onChange={
                                            event =>
                                                setCreateForm(
                                                    current => ({
                                                        ...current,

                                                        password:
                                                            event
                                                                .target
                                                                .value,
                                                    }),
                                                )
                                        }
                                        style={
                                            styles.input
                                        }
                                        placeholder="Введите пароль"
                                    />

                                    <button
                                        type="button"
                                        style={
                                            styles.eyeButton
                                        }
                                        onClick={() =>
                                            setShowPassword(
                                                current =>
                                                    !current,
                                            )
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                size={
                                                    18
                                                }
                                            />
                                        ) : (
                                            <Eye
                                                size={
                                                    18
                                                }
                                            />
                                        )}
                                    </button>
                                </div>
                            </label>

                            <label
                                style={
                                    styles.field
                                }
                            >
                                <span>
                                    Роль
                                </span>

                                <select
                                    value={
                                        createForm.role
                                    }
                                    onChange={
                                        event =>
                                            setCreateForm(
                                                current => ({
                                                    ...current,

                                                    role:
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
                                    <option value="Administrator">
                                        Администратор
                                    </option>

                                    <option value="Printer">
                                        Печатник
                                    </option>

                                    <option value="PlotterOperator">
                                        Плоттерщик
                                    </option>

                                    <option value="Viewer">
                                        Наблюдатель
                                    </option>
                                </select>
                            </label>
                        </div>

                        <div
                            style={
                                styles.modalFooter
                            }
                        >
                            <button
                                type="button"
                                className="button secondary"
                                onClick={() =>
                                    setShowCreateModal(
                                        false,
                                    )
                                }
                            >
                                Отмена
                            </button>

                            <button
                                type="submit"
                                className="button primary"
                                disabled={
                                    creating
                                }
                            >
                                <Plus
                                    size={17}
                                />

                                {creating
                                    ? 'Создание...'
                                    : 'Создать'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {selectedUser && (
                <Modal
                    onClose={
                        closeAccessModal
                    }
                >
                    <div
                        style={
                            styles.accessModal
                        }
                    >
                        <ModalHeader
                            title={`Права: ${selectedUser.fullName}`}
                            onClose={
                                closeAccessModal
                            }
                        />

                        <div
                            style={
                                styles.accessToolbar
                            }
                        >
                            <div>
                                <strong>
                                    {getRoleLabel(
                                        selectedUser.role,
                                    )}
                                </strong>

                                <div
                                    style={
                                        styles.helper
                                    }
                                >
                                    @
                                    {
                                        selectedUser.login
                                    }
                                </div>
                            </div>

                            {selectedUser.role !==
                                'Administrator' && (
                                    <div
                                        style={
                                            styles.accessActions
                                        }
                                    >
                                        <button
                                            type="button"
                                            className="button secondary"
                                            onClick={
                                                enableEverything
                                            }
                                        >
                                            Разрешить всё
                                        </button>

                                        <button
                                            type="button"
                                            className="button secondary"
                                            onClick={
                                                disableEverything
                                            }
                                        >
                                            Снять всё
                                        </button>
                                    </div>
                                )}
                        </div>

                        {selectedUser.role ===
                            'Administrator' ? (
                            <Message type="info">
                                Администратор
                                имеет полный
                                доступ ко всем
                                категориям и
                                операциям.
                                Ограничить его
                                права нельзя.
                            </Message>
                        ) : loadingAccesses ? (
                            <div
                                style={
                                    styles.empty
                                }
                            >
                                Загрузка прав...
                            </div>
                        ) : (
                            <div
                                style={
                                    styles.tableScroll
                                }
                            >
                                <table
                                    style={{
                                        ...styles.table,

                                        minWidth:
                                            1050,
                                    }}
                                >
                                    <thead>
                                        <tr>
                                            <th
                                                style={
                                                    styles.th
                                                }
                                            >
                                                Категория
                                            </th>

                                            <PermissionHeader>
                                                Просмотр
                                            </PermissionHeader>

                                            <PermissionHeader>
                                                Приход
                                            </PermissionHeader>

                                            <PermissionHeader>
                                                Расход
                                            </PermissionHeader>

                                            <PermissionHeader>
                                                Инв. склада
                                            </PermissionHeader>

                                            <PermissionHeader>
                                                Инв. ORACAL
                                            </PermissionHeader>

                                            <PermissionHeader>
                                                Всё
                                            </PermissionHeader>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {accesses.map(
                                            access => {
                                                const allEnabled =
                                                    access.canView &&
                                                    access.canReceive &&
                                                    access.canIssue &&
                                                    access.canInventoryStandard &&
                                                    access.canInventoryOracal;

                                                return (
                                                    <tr
                                                        key={
                                                            access.categoryId
                                                        }
                                                    >
                                                        <td
                                                            style={
                                                                styles.td
                                                            }
                                                        >
                                                            <strong>
                                                                {
                                                                    access.categoryName
                                                                }
                                                            </strong>
                                                        </td>

                                                        <PermissionCell
                                                            checked={
                                                                access.canView
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updateAccess(
                                                                        access.categoryId,
                                                                        'canView',
                                                                        value,
                                                                    )
                                                            }
                                                        />

                                                        <PermissionCell
                                                            checked={
                                                                access.canReceive
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updateAccess(
                                                                        access.categoryId,
                                                                        'canReceive',
                                                                        value,
                                                                    )
                                                            }
                                                        />

                                                        <PermissionCell
                                                            checked={
                                                                access.canIssue
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updateAccess(
                                                                        access.categoryId,
                                                                        'canIssue',
                                                                        value,
                                                                    )
                                                            }
                                                        />

                                                        <PermissionCell
                                                            checked={
                                                                access.canInventoryStandard
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updateAccess(
                                                                        access.categoryId,
                                                                        'canInventoryStandard',
                                                                        value,
                                                                    )
                                                            }
                                                        />

                                                        <PermissionCell
                                                            checked={
                                                                access.canInventoryOracal
                                                            }
                                                            onChange={
                                                                value =>
                                                                    updateAccess(
                                                                        access.categoryId,
                                                                        'canInventoryOracal',
                                                                        value,
                                                                    )
                                                            }
                                                        />

                                                        <PermissionCell
                                                            checked={
                                                                allEnabled
                                                            }
                                                            onChange={
                                                                value =>
                                                                    setAllForCategory(
                                                                        access.categoryId,
                                                                        value,
                                                                    )
                                                            }
                                                        />
                                                    </tr>
                                                );
                                            },
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div
                            style={
                                styles.modalFooter
                            }
                        >
                            <button
                                type="button"
                                className="button secondary"
                                onClick={
                                    closeAccessModal
                                }
                            >
                                Закрыть
                            </button>

                            {selectedUser.role !==
                                'Administrator' && (
                                    <button
                                        type="button"
                                        className="button primary"
                                        disabled={
                                            savingAccesses ||
                                            loadingAccesses
                                        }
                                        onClick={
                                            saveAccesses
                                        }
                                    >
                                        <Save
                                            size={17}
                                        />

                                        {savingAccesses
                                            ? 'Сохранение...'
                                            : 'Сохранить права'}
                                    </button>
                                )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function PermissionHeader({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <th
            style={{
                ...styles.th,

                textAlign:
                    'center',
            }}
        >
            {children}
        </th>
    );
}

function PermissionCell({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange:
    (value: boolean) => void;
}) {
    return (
        <td
            style={{
                ...styles.td,

                textAlign:
                    'center',
            }}
        >
            <input
                type="checkbox"
                checked={
                    checked
                }
                onChange={
                    event =>
                        onChange(
                            event
                                .target
                                .checked,
                        )
                }
                style={
                    styles.checkbox
                }
            />
        </td>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div
            style={
                styles.statCard
            }
        >
            <div
                style={
                    styles.statIcon
                }
            >
                {icon}
            </div>

            <div>
                <div
                    style={
                        styles.statLabel
                    }
                >
                    {label}
                </div>

                <div
                    style={
                        styles.statValue
                    }
                >
                    {value}
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: string;
    value: string;
    placeholder?: string;
    onChange:
    (value: string) => void;
}) {
    return (
        <label
            style={
                styles.field
            }
        >
            <span>
                {label}
            </span>

            <input
                value={
                    value
                }
                placeholder={
                    placeholder
                }
                onChange={
                    event =>
                        onChange(
                            event
                                .target
                                .value,
                        )
                }
                style={
                    styles.input
                }
            />
        </label>
    );
}

function Modal({
    children,
    onClose,
}: {
    children: ReactNode;
    onClose: () => void;
}) {
    return (
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
                        onClose();
                    }
                }
            }
        >
            {children}
        </div>
    );
}

function ModalHeader({
    title,
    onClose,
}: {
    title: string;
    onClose: () => void;
}) {
    return (
        <div
            style={
                styles.modalHeader
            }
        >
            <div>
                <p
                    className="eyebrow"
                    style={{
                        marginBottom:
                            5,
                    }}
                >
                    ADMINISTRATION
                </p>

                <h2
                    style={{
                        margin:
                            0,
                    }}
                >
                    {title}
                </h2>
            </div>

            <button
                type="button"
                style={
                    styles.closeButton
                }
                onClick={
                    onClose
                }
            >
                <X
                    size={20}
                />
            </button>
        </div>
    );
}

function Message({
    type,
    children,
}: {
    type:
    | 'error'
    | 'success'
    | 'info';

    children:
    ReactNode;
}) {
    const typeStyle =
        type === 'error'
            ? styles.errorMessage
            : type === 'success'
                ? styles.successMessage
                : styles.infoMessage;

    return (
        <div
            style={{
                ...styles.message,

                ...typeStyle,
            }}
        >
            {children}
        </div>
    );
}

function getApiError(
    error: any,
    fallback: string,
) {
    return (
        error?.response?.data
            ?.message ??
        error?.response?.data
            ?.title ??
        fallback
    );
}

function getRoleLabel(
    role: string,
) {
    switch (role) {
        case 'Administrator':
            return 'Администратор';

        case 'Printer':
            return 'Печатник';

        case 'PlotterOperator':
            return 'Плоттерщик';

        case 'Viewer':
            return 'Наблюдатель';

        default:
            return role;
    }
}

function formatDate(
    value: string,
) {
    if (!value) {
        return '—';
    }

    return new Date(
        value,
    ).toLocaleDateString(
        'ru-RU',
    );
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

        flexWrap:
            'wrap',
    },

    statsGrid: {
        display:
            'grid',

        gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',

        gap:
            14,

        marginBottom:
            18,
    },

    statCard: {
        display:
            'flex',

        alignItems:
            'center',

        gap:
            14,

        padding:
            18,

        borderRadius:
            14,

        border:
            '1px solid #222b35',

        background:
            'linear-gradient(145deg, rgba(19,26,35,.96), rgba(12,17,23,.96))',
    },

    statIcon: {
        width:
            42,

        height:
            42,

        display:
            'grid',

        placeItems:
            'center',

        borderRadius:
            12,

        background:
            'rgba(255,255,255,.05)',

        color:
            '#8eb9ff',
    },

    statLabel: {
        color:
            '#8b98a8',

        fontSize:
            12,
    },

    statValue: {
        marginTop:
            3,

        color:
            '#f8fafc',

        fontSize:
            25,

        fontWeight:
            800,
    },

    toolbar: {
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

    helper: {
        margin:
            '5px 0 0',

        color:
            '#7e8a98',

        fontSize:
            11,
    },

    searchBox: {
        minWidth:
            300,

        minHeight:
            42,

        display:
            'flex',

        alignItems:
            'center',

        gap:
            8,

        padding:
            '0 12px',

        border:
            '1px solid #303a49',

        borderRadius:
            10,

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
    },

    tableScroll: {
        overflowX:
            'auto',
    },

    table: {
        width:
            '100%',

        minWidth:
            760,

        borderCollapse:
            'collapse',
    },

    th: {
        padding:
            '12px 14px',

        borderBottom:
            '1px solid rgba(255,255,255,.08)',

        color:
            '#7e8a98',

        textAlign:
            'left',

        fontSize:
            10,

        fontWeight:
            800,

        textTransform:
            'uppercase',

        letterSpacing:
            '.04em',

        whiteSpace:
            'nowrap',
    },

    td: {
        padding:
            14,

        borderBottom:
            '1px solid rgba(255,255,255,.06)',

        color:
            '#d9e1ea',

        fontSize:
            13,

        verticalAlign:
            'middle',
    },

    roleBadge: {
        display:
            'inline-flex',

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(96,165,250,.12)',

        border:
            '1px solid rgba(96,165,250,.2)',

        color:
            '#bfdbfe',

        fontSize:
            11,

        fontWeight:
            700,
    },

    activeBadge: {
        display:
            'inline-flex',

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(74,222,128,.1)',

        color:
            '#86efac',

        fontSize:
            11,
    },

    inactiveBadge: {
        display:
            'inline-flex',

        padding:
            '5px 9px',

        borderRadius:
            999,

        background:
            'rgba(148,163,184,.08)',

        color:
            '#94a3b8',

        fontSize:
            11,
    },

    empty: {
        padding:
            34,

        textAlign:
            'center',

        color:
            '#7e8a98',
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
            'rgba(0,0,0,.72)',

        backdropFilter:
            'blur(7px)',
    },

    modal: {
        width:
            'min(650px, 96vw)',

        maxHeight:
            '90vh',

        overflowY:
            'auto',

        padding:
            24,

        border:
            '1px solid #263245',

        borderRadius:
            20,

        background:
            '#111a2a',

        boxShadow:
            '0 30px 100px rgba(0,0,0,.55)',
    },

    accessModal: {
        width:
            'min(1180px, 96vw)',

        maxHeight:
            '90vh',

        overflowY:
            'auto',

        padding:
            24,

        border:
            '1px solid #263245',

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

        alignItems:
            'center',

        justifyContent:
            'space-between',

        gap:
            16,

        marginBottom:
            22,
    },

    closeButton: {
        width:
            42,

        height:
            42,

        display:
            'grid',

        placeItems:
            'center',

        border:
            '1px solid rgba(255,255,255,.05)',

        borderRadius:
            10,

        background:
            'rgba(255,255,255,.06)',

        color:
            '#d8e0ea',

        cursor:
            'pointer',
    },

    formGrid: {
        display:
            'grid',

        gap:
            17,
    },

    field: {
        display:
            'grid',

        gap:
            8,

        color:
            '#e5e7eb',

        fontSize:
            13,

        fontWeight:
            700,
    },

    input: {
        width:
            '100%',

        minHeight:
            50,

        boxSizing:
            'border-box',

        padding:
            '11px 14px',

        border:
            '1px solid #303a49',

        borderRadius:
            10,

        background:
            '#1a2332',

        color:
            '#f8fafc',

        outline:
            0,
    },

    passwordBox: {
        position:
            'relative',
    },

    eyeButton: {
        position:
            'absolute',

        top:
            '50%',

        right:
            8,

        transform:
            'translateY(-50%)',

        width:
            36,

        height:
            36,

        display:
            'grid',

        placeItems:
            'center',

        border:
            0,

        borderRadius:
            8,

        background:
            'transparent',

        color:
            '#91a0b2',

        cursor:
            'pointer',
    },

    modalFooter: {
        display:
            'flex',

        justifyContent:
            'flex-end',

        gap:
            10,

        flexWrap:
            'wrap',

        marginTop:
            22,
    },

    accessToolbar: {
        display:
            'flex',

        justifyContent:
            'space-between',

        alignItems:
            'center',

        gap:
            15,

        flexWrap:
            'wrap',

        marginBottom:
            18,
    },

    accessActions: {
        display:
            'flex',

        gap:
            8,

        flexWrap:
            'wrap',
    },

    checkbox: {
        width:
            18,

        height:
            18,

        cursor:
            'pointer',

        accentColor:
            '#3b82f6',
    },

    message: {
        padding:
            '13px 15px',

        marginBottom:
            16,

        borderRadius:
            11,

        border:
            '1px solid rgba(255,255,255,.1)',
    },

    errorMessage: {
        borderColor:
            'rgba(248,113,113,.35)',

        background:
            'rgba(127,29,29,.18)',

        color:
            '#fca5a5',
    },

    successMessage: {
        borderColor:
            'rgba(74,222,128,.3)',

        background:
            'rgba(20,83,45,.18)',

        color:
            '#86efac',
    },

    infoMessage: {
        borderColor:
            'rgba(96,165,250,.22)',

        background:
            'rgba(30,64,175,.10)',

        color:
            '#bfdbfe',
    },
};
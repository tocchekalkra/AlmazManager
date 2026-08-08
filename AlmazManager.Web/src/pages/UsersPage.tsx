import {
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type FormEvent,
} from 'react';

import {
    Check,
    ChevronDown,
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
    canInventory: boolean;
};

type CreateUserForm = {
    fullName: string;
    login: string;
    password: string;
    role: string;
};

type RoleOption = {
    value: string;
    label: string;
    description: string;
};

const roleOptions: RoleOption[] = [
    {
        value: 'Administrator',
        label: 'Администратор',
        description: 'Полный доступ ко всей системе',
    },
    {
        value: 'Printer',
        label: 'Печатник',
        description: 'Работа со складом по назначенным категориям',
    },
    {
        value: 'PlotterOperator',
        label: 'Плоттерщик',
        description: 'Работа с назначенными категориями и Oracal',
    },
    {
        value: 'Viewer',
        label: 'Наблюдатель',
        description: 'Только просмотр разрешённых данных',
    },
];

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
        useState<CreateUserForm>(emptyCreateForm);

    const [creating, setCreating] =
        useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const [roleDropdownOpen, setRoleDropdownOpen] =
        useState(false);

    const [selectedUser, setSelectedUser] =
        useState<UserItem | null>(null);

    const [accesses, setAccesses] =
        useState<CategoryAccess[]>([]);

    const [loadingAccesses, setLoadingAccesses] =
        useState(false);

    const [savingAccesses, setSavingAccesses] =
        useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    async function loadUsers() {
        try {
            setLoading(true);
            setError('');

            const response =
                await api.get<UserItem[]>('/users');

            setUsers(response.data ?? []);
        } catch (requestError: any) {
            console.error(
                'Ошибка загрузки пользователей:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                requestError?.response?.data?.title ??
                'Не удалось загрузить пользователей.',
            );
        } finally {
            setLoading(false);
        }
    }

    const filteredUsers = useMemo(() => {
        const query =
            search.trim().toLowerCase();

        if (!query) {
            return users;
        }

        return users.filter(
            (user) =>
                user.fullName
                    .toLowerCase()
                    .includes(query) ||

                user.login
                    .toLowerCase()
                    .includes(query) ||

                getRoleLabel(user.role)
                    .toLowerCase()
                    .includes(query),
        );
    }, [users, search]);

    const activeUsers =
        users.filter(
            (user) => user.isActive,
        ).length;

    const administrators =
        users.filter(
            (user) =>
                user.role === 'Administrator',
        ).length;

    const workers =
        users.filter(
            (user) =>
                user.role === 'Printer' ||
                user.role === 'PlotterOperator',
        ).length;

    async function handleCreateUser(
        event: FormEvent<HTMLFormElement>,
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

            closeCreateModal();

            setSuccess(
                'Пользователь успешно создан.',
            );

            await loadUsers();
        } catch (requestError: any) {
            console.error(
                'Ошибка создания пользователя:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                requestError?.response?.data?.title ??
                'Не удалось создать пользователя.',
            );
        } finally {
            setCreating(false);
        }
    }

    function openCreateModal() {
        setError('');
        setSuccess('');

        setCreateForm(emptyCreateForm);

        setShowPassword(false);
        setRoleDropdownOpen(false);
        setShowCreateModal(true);
    }

    function closeCreateModal() {
        setShowCreateModal(false);

        setCreateForm(emptyCreateForm);

        setShowPassword(false);
        setRoleDropdownOpen(false);
    }

    async function openAccessModal(
        user: UserItem,
    ) {
        setSelectedUser(user);
        setAccesses([]);

        setError('');
        setSuccess('');

        try {
            setLoadingAccesses(true);

            const response =
                await api.get<CategoryAccess[]>(
                    `/users/${user.id}/category-access`,
                );

            setAccesses(
                response.data ?? [],
            );
        } catch (requestError: any) {
            console.error(
                'Ошибка загрузки прав:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                requestError?.response?.data?.title ??
                'Не удалось загрузить права пользователя.',
            );
        } finally {
            setLoadingAccesses(false);
        }
    }

    function updateAccess(
        categoryId: string,
        field:
            | 'canView'
            | 'canReceive'
            | 'canIssue'
            | 'canInventory',
        value: boolean,
    ) {
        setAccesses(
            (current) =>
                current.map(
                    (access) => {
                        if (
                            access.categoryId !==
                            categoryId
                        ) {
                            return access;
                        }

                        if (
                            field === 'canView' &&
                            value === false
                        ) {
                            return {
                                ...access,

                                canView:
                                    false,

                                canReceive:
                                    false,

                                canIssue:
                                    false,

                                canInventory:
                                    false,
                            };
                        }

                        if (
                            field !== 'canView' &&
                            value === true
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
                            [field]: value,
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
            (current) =>
                current.map(
                    (access) =>
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

                                canInventory:
                                    value,
                            }
                            : access,
                ),
        );
    }

    function enableEverything() {
        setAccesses(
            (current) =>
                current.map(
                    (access) => ({
                        ...access,

                        canView:
                            true,

                        canReceive:
                            true,

                        canIssue:
                            true,

                        canInventory:
                            true,
                    }),
                ),
        );
    }

    function disableEverything() {
        setAccesses(
            (current) =>
                current.map(
                    (access) => ({
                        ...access,

                        canView:
                            false,

                        canReceive:
                            false,

                        canIssue:
                            false,

                        canInventory:
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
            setSavingAccesses(true);
            setError('');
            setSuccess('');

            await api.put(
                `/users/${selectedUser.id}/category-access`,
                {
                    accesses:
                        accesses.map(
                            (access) => ({
                                categoryId:
                                    access.categoryId,

                                canView:
                                    access.canView,

                                canReceive:
                                    access.canReceive,

                                canIssue:
                                    access.canIssue,

                                canInventory:
                                    access.canInventory,
                            }),
                        ),
                },
            );

            setSuccess(
                `Права пользователя «${selectedUser.fullName}» сохранены.`,
            );

            setSelectedUser(null);
            setAccesses([]);
        } catch (requestError: any) {
            console.error(
                'Ошибка сохранения прав:',
                requestError,
            );

            setError(
                requestError?.response?.data?.message ??
                requestError?.response?.data?.title ??
                'Не удалось сохранить права пользователя.',
            );
        } finally {
            setSavingAccesses(false);
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
                        Управление пользователями,
                        ролями и доступом к категориям склада.
                    </p>
                </div>

                <div style={headingActionsStyle}>
                    <button
                        type="button"
                        className="button secondary"
                        onClick={loadUsers}
                        disabled={loading}
                    >
                        <RefreshCcw
                            size={17}
                        />

                        Обновить
                    </button>

                    <button
                        type="button"
                        className="button primary"
                        onClick={openCreateModal}
                    >
                        <Plus size={17} />

                        Добавить пользователя
                    </button>
                </div>
            </div>

            {error && (
                <div
                    style={{
                        ...messageStyle,

                        borderColor:
                            'rgba(248,113,113,.35)',

                        background:
                            'rgba(127,29,29,.18)',

                        color:
                            '#fca5a5',
                    }}
                >
                    {error}
                </div>
            )}

            {success && (
                <div
                    style={{
                        ...messageStyle,

                        borderColor:
                            'rgba(74,222,128,.3)',

                        background:
                            'rgba(20,83,45,.18)',

                        color:
                            '#86efac',
                    }}
                >
                    {success}
                </div>
            )}

            <div style={statsGrid}>
                <StatCard
                    icon={
                        <Users size={20} />
                    }
                    label="Всего пользователей"
                    value={users.length}
                />

                <StatCard
                    icon={
                        <ShieldCheck
                            size={20}
                        />
                    }
                    label="Активных"
                    value={activeUsers}
                />

                <StatCard
                    icon={
                        <KeyRound
                            size={20}
                        />
                    }
                    label="Администраторов"
                    value={administrators}
                />

                <StatCard
                    icon={
                        <UserCog
                            size={20}
                        />
                    }
                    label="Печатников / плоттерщиков"
                    value={workers}
                />
            </div>

            <section className="panel">
                <div style={panelToolbarStyle}>
                    <div>
                        <h2
                            style={{
                                margin: 0,
                            }}
                        >
                            Пользователи системы
                        </h2>

                        <p
                            style={{
                                margin:
                                    '6px 0 0',

                                color:
                                    '#7e8a98',

                                fontSize:
                                    12,
                            }}
                        >
                            Администратор может
                            назначать права по каждой
                            категории отдельно.
                        </p>
                    </div>

                    <div style={searchWrapperStyle}>
                        <Search
                            size={17}
                            style={{
                                position:
                                    'absolute',

                                left:
                                    13,

                                top:
                                    '50%',

                                transform:
                                    'translateY(-50%)',

                                opacity:
                                    0.55,
                            }}
                        />

                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value,
                                )
                            }
                            placeholder="Поиск по имени, логину или роли"
                            style={{
                                ...inputStyle,

                                paddingLeft:
                                    40,
                            }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div style={emptyStateStyle}>
                        Загрузка пользователей...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div style={emptyStateStyle}>
                        Пользователи не найдены.
                    </div>
                ) : (
                    <div
                        style={{
                            overflowX:
                                'auto',
                        }}
                    >
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>
                                        Пользователь
                                    </th>

                                    <th style={thStyle}>
                                        Логин
                                    </th>

                                    <th style={thStyle}>
                                        Роль
                                    </th>

                                    <th style={thStyle}>
                                        Статус
                                    </th>

                                    <th style={thStyle}>
                                        Создан
                                    </th>

                                    <th
                                        style={{
                                            ...thStyle,

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
                                    (user) => (
                                        <tr
                                            key={
                                                user.id
                                            }
                                        >
                                            <td style={tdStyle}>
                                                <strong>
                                                    {
                                                        user.fullName
                                                    }
                                                </strong>
                                            </td>

                                            <td style={tdStyle}>
                                                @
                                                {
                                                    user.login
                                                }
                                            </td>

                                            <td style={tdStyle}>
                                                <span
                                                    style={
                                                        roleBadgeStyle
                                                    }
                                                >
                                                    {getRoleLabel(
                                                        user.role,
                                                    )}
                                                </span>
                                            </td>

                                            <td style={tdStyle}>
                                                <span
                                                    style={{
                                                        ...statusBadgeStyle,

                                                        opacity:
                                                            user.isActive
                                                                ? 1
                                                                : 0.5,
                                                    }}
                                                >
                                                    {user.isActive
                                                        ? 'Активен'
                                                        : 'Архив'}
                                                </span>
                                            </td>

                                            <td style={tdStyle}>
                                                {formatDate(
                                                    user.createdAtUtc,
                                                )}
                                            </td>

                                            <td
                                                style={{
                                                    ...tdStyle,

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
                <ModalOverlay
                    onClose={
                        closeCreateModal
                    }
                >
                    <form
                        onSubmit={
                            handleCreateUser
                        }
                        style={modalStyle}
                    >
                        <ModalHeader
                            title="Новый пользователь"
                            onClose={
                                closeCreateModal
                            }
                        />

                        <div
                            style={{
                                display:
                                    'grid',

                                gap:
                                    18,
                            }}
                        >
                            <Field
                                label="ФИО / имя"
                                value={
                                    createForm.fullName
                                }
                                placeholder="Например: Иван Петров"
                                onChange={(
                                    value,
                                ) =>
                                    setCreateForm(
                                        (
                                            current,
                                        ) => ({
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
                                onChange={(
                                    value,
                                ) =>
                                    setCreateForm(
                                        (
                                            current,
                                        ) => ({
                                            ...current,

                                            login:
                                                value,
                                        }),
                                    )
                                }
                            />

                            <label style={fieldStyle}>
                                <span>
                                    Пароль
                                </span>

                                <div
                                    style={
                                        passwordWrapperStyle
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
                                        onChange={(
                                            event,
                                        ) =>
                                            setCreateForm(
                                                (
                                                    current,
                                                ) => ({
                                                    ...current,

                                                    password:
                                                        event
                                                            .target
                                                            .value,
                                                }),
                                            )
                                        }
                                        placeholder="Введите пароль"
                                        autoComplete="new-password"
                                        style={{
                                            ...inputStyle,

                                            paddingRight:
                                                50,
                                        }}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(
                                                (
                                                    current,
                                                ) =>
                                                    !current,
                                            )
                                        }
                                        style={
                                            passwordToggleStyle
                                        }
                                        title={
                                            showPassword
                                                ? 'Скрыть пароль'
                                                : 'Показать пароль'
                                        }
                                        aria-label={
                                            showPassword
                                                ? 'Скрыть пароль'
                                                : 'Показать пароль'
                                        }
                                    >
                                        {showPassword ? (
                                            <EyeOff
                                                size={
                                                    19
                                                }
                                            />
                                        ) : (
                                            <Eye
                                                size={
                                                    19
                                                }
                                            />
                                        )}
                                    </button>
                                </div>
                            </label>

                            <label style={fieldStyle}>
                                <span>
                                    Роль
                                </span>

                                <RoleDropdown
                                    value={
                                        createForm.role
                                    }
                                    isOpen={
                                        roleDropdownOpen
                                    }
                                    onOpenChange={
                                        setRoleDropdownOpen
                                    }
                                    onChange={(
                                        role,
                                    ) => {
                                        setCreateForm(
                                            (
                                                current,
                                            ) => ({
                                                ...current,

                                                role,
                                            }),
                                        );

                                        setRoleDropdownOpen(
                                            false,
                                        );
                                    }}
                                />
                            </label>
                        </div>

                        <div style={modalFooterStyle}>
                            <button
                                type="button"
                                className="button secondary"
                                onClick={
                                    closeCreateModal
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
                </ModalOverlay>
            )}

            {selectedUser && (
                <ModalOverlay
                    onClose={() =>
                        setSelectedUser(null)
                    }
                >
                    <div
                        style={{
                            ...modalStyle,

                            width:
                                'min(1050px, 96vw)',
                        }}
                    >
                        <ModalHeader
                            title={`Права: ${selectedUser.fullName}`}
                            onClose={() =>
                                setSelectedUser(
                                    null,
                                )
                            }
                        />

                        <div style={accessHeaderStyle}>
                            <div>
                                <div
                                    style={{
                                        fontWeight:
                                            700,
                                    }}
                                >
                                    {getRoleLabel(
                                        selectedUser.role,
                                    )}
                                </div>

                                <div
                                    style={{
                                        color:
                                            '#7e8a98',

                                        marginTop:
                                            4,
                                    }}
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
                                        style={{
                                            display:
                                                'flex',

                                            gap:
                                                8,

                                            flexWrap:
                                                'wrap',
                                        }}
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
                            <div
                                style={{
                                    ...messageStyle,

                                    margin:
                                        0,

                                    color:
                                        '#cbd5e1',
                                }}
                            >
                                Администратор имеет
                                полный доступ ко всем
                                категориям и операциям.
                                Ограничить его права нельзя.
                            </div>
                        ) : loadingAccesses ? (
                            <div style={emptyStateStyle}>
                                Загрузка прав...
                            </div>
                        ) : (
                            <div
                                style={{
                                    overflowX:
                                        'auto',
                                }}
                            >
                                <table style={tableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={thStyle}>
                                                Категория
                                            </th>

                                            <th style={centerThStyle}>
                                                Просмотр
                                            </th>

                                            <th style={centerThStyle}>
                                                Приход
                                            </th>

                                            <th style={centerThStyle}>
                                                Расход
                                            </th>

                                            <th style={centerThStyle}>
                                                Инвентаризация
                                            </th>

                                            <th style={centerThStyle}>
                                                Всё
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {accesses.map(
                                            (
                                                access,
                                            ) => {
                                                const allEnabled =
                                                    access.canView &&
                                                    access.canReceive &&
                                                    access.canIssue &&
                                                    access.canInventory;

                                                return (
                                                    <tr
                                                        key={
                                                            access.categoryId
                                                        }
                                                    >
                                                        <td
                                                            style={
                                                                tdStyle
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
                                                            onChange={(
                                                                value,
                                                            ) =>
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
                                                            onChange={(
                                                                value,
                                                            ) =>
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
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                updateAccess(
                                                                    access.categoryId,
                                                                    'canIssue',
                                                                    value,
                                                                )
                                                            }
                                                        />

                                                        <PermissionCell
                                                            checked={
                                                                access.canInventory
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
                                                                updateAccess(
                                                                    access.categoryId,
                                                                    'canInventory',
                                                                    value,
                                                                )
                                                            }
                                                        />

                                                        <PermissionCell
                                                            checked={
                                                                allEnabled
                                                            }
                                                            onChange={(
                                                                value,
                                                            ) =>
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

                        <div style={modalFooterStyle}>
                            <button
                                type="button"
                                className="button secondary"
                                onClick={() =>
                                    setSelectedUser(
                                        null,
                                    )
                                }
                            >
                                Закрыть
                            </button>

                            {selectedUser.role !==
                                'Administrator' && (
                                    <button
                                        type="button"
                                        className="button primary"
                                        onClick={
                                            saveAccesses
                                        }
                                        disabled={
                                            savingAccesses ||
                                            loadingAccesses
                                        }
                                    >
                                        <Save
                                            size={
                                                17
                                            }
                                        />

                                        {savingAccesses
                                            ? 'Сохранение...'
                                            : 'Сохранить права'}
                                    </button>
                                )}
                        </div>
                    </div>
                </ModalOverlay>
            )}
        </div>
    );
}

function RoleDropdown({
    value,
    isOpen,
    onOpenChange,
    onChange,
}: {
    value: string;
    isOpen: boolean;
    onOpenChange: (value: boolean) => void;
    onChange: (value: string) => void;
}) {
    const wrapperRef =
        useRef<HTMLDivElement | null>(
            null,
        );

    const selected =
        roleOptions.find(
            (option) =>
                option.value === value,
        ) ?? roleOptions[1];

    useEffect(() => {
        function handleMouseDown(
            event: MouseEvent,
        ) {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(
                    event.target as Node,
                )
            ) {
                onOpenChange(false);
            }
        }

        document.addEventListener(
            'mousedown',
            handleMouseDown,
        );

        return () =>
            document.removeEventListener(
                'mousedown',
                handleMouseDown,
            );
    }, [onOpenChange]);

    return (
        <div
            ref={wrapperRef}
            style={dropdownWrapperStyle}
        >
            <button
                type="button"
                onClick={() =>
                    onOpenChange(!isOpen)
                }
                style={{
                    ...dropdownButtonStyle,

                    borderColor:
                        isOpen
                            ? '#3b82f6'
                            : '#303a49',

                    boxShadow:
                        isOpen
                            ? '0 0 0 3px rgba(59,130,246,.10)'
                            : 'none',
                }}
            >
                <div
                    style={{
                        minWidth:
                            0,

                        textAlign:
                            'left',
                    }}
                >
                    <div
                        style={{
                            color:
                                '#f8fafc',

                            fontWeight:
                                700,

                            fontSize:
                                14,
                        }}
                    >
                        {selected.label}
                    </div>

                    <div
                        style={{
                            color:
                                '#78879a',

                            fontSize:
                                11,

                            marginTop:
                                3,

                            whiteSpace:
                                'nowrap',

                            overflow:
                                'hidden',

                            textOverflow:
                                'ellipsis',
                        }}
                    >
                        {
                            selected.description
                        }
                    </div>
                </div>

                <ChevronDown
                    size={19}
                    style={{
                        flex:
                            '0 0 auto',

                        color:
                            '#8fa0b5',

                        transform:
                            isOpen
                                ? 'rotate(180deg)'
                                : 'rotate(0deg)',

                        transition:
                            'transform .16s ease',
                    }}
                />
            </button>

            {isOpen && (
                <div style={dropdownMenuStyle}>
                    {roleOptions.map(
                        (option) => {
                            const isSelected =
                                option.value ===
                                value;

                            return (
                                <button
                                    key={
                                        option.value
                                    }
                                    type="button"
                                    onClick={() =>
                                        onChange(
                                            option.value,
                                        )
                                    }
                                    style={{
                                        ...dropdownOptionStyle,

                                        background:
                                            isSelected
                                                ? 'rgba(59,130,246,.14)'
                                                : 'transparent',

                                        borderColor:
                                            isSelected
                                                ? 'rgba(59,130,246,.22)'
                                                : 'transparent',
                                    }}
                                >
                                    <div
                                        style={{
                                            minWidth:
                                                0,

                                            textAlign:
                                                'left',
                                        }}
                                    >
                                        <div
                                            style={{
                                                color:
                                                    '#f1f5f9',

                                                fontWeight:
                                                    700,

                                                fontSize:
                                                    13,
                                            }}
                                        >
                                            {
                                                option.label
                                            }
                                        </div>

                                        <div
                                            style={{
                                                color:
                                                    '#718096',

                                                fontSize:
                                                    11,

                                                marginTop:
                                                    3,
                                            }}
                                        >
                                            {
                                                option.description
                                            }
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <Check
                                            size={
                                                18
                                            }
                                            style={{
                                                color:
                                                    '#60a5fa',

                                                flex:
                                                    '0 0 auto',
                                            }}
                                        />
                                    )}
                                </button>
                            );
                        },
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: number;
}) {
    return (
        <div style={statCardStyle}>
            <div style={statIconStyle}>
                {icon}
            </div>

            <div>
                <div style={statLabelStyle}>
                    {label}
                </div>

                <div style={statValueStyle}>
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
    onChange: (value: string) => void;
}) {
    return (
        <label style={fieldStyle}>
            <span>
                {label}
            </span>

            <input
                value={value}
                placeholder={placeholder}
                onChange={(event) =>
                    onChange(
                        event.target.value,
                    )
                }
                style={inputStyle}
            />
        </label>
    );
}

function PermissionCell({
    checked,
    onChange,
}: {
    checked: boolean;
    onChange: (value: boolean) => void;
}) {
    return (
        <td
            style={{
                ...tdStyle,

                textAlign:
                    'center',
            }}
        >
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) =>
                    onChange(
                        event.target.checked,
                    )
                }
                style={{
                    width:
                        18,

                    height:
                        18,

                    cursor:
                        'pointer',

                    accentColor:
                        '#3b82f6',
                }}
            />
        </td>
    );
}

function ModalOverlay({
    children,
    onClose,
}: {
    children: React.ReactNode;
    onClose: () => void;
}) {
    return (
        <div
            style={overlayStyle}
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
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
        <div style={modalHeaderStyle}>
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

                        fontSize:
                            24,

                        color:
                            '#f8fafc',
                    }}
                >
                    {title}
                </h2>
            </div>

            <button
                type="button"
                onClick={onClose}
                style={iconButtonStyle}
            >
                <X size={20} />
            </button>
        </div>
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

const headingActionsStyle: CSSProperties = {
    display:
        'flex',

    gap:
        10,

    flexWrap:
        'wrap',
};

const statsGrid: CSSProperties = {
    display:
        'grid',

    gridTemplateColumns:
        'repeat(4, minmax(0, 1fr))',

    gap:
        14,

    marginBottom:
        18,
};

const statCardStyle: CSSProperties = {
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
};

const statIconStyle: CSSProperties = {
    width:
        42,

    height:
        42,

    borderRadius:
        12,

    display:
        'grid',

    placeItems:
        'center',

    background:
        'rgba(255,255,255,.05)',

    color:
        '#8eb9ff',
};

const statLabelStyle: CSSProperties = {
    fontSize:
        12,

    color:
        '#8b98a8',
};

const statValueStyle: CSSProperties = {
    fontSize:
        25,

    fontWeight:
        800,

    marginTop:
        3,

    color:
        '#f8fafc',
};

const panelToolbarStyle: CSSProperties = {
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
};

const searchWrapperStyle: CSSProperties = {
    position:
        'relative',

    minWidth:
        300,
};

const tableStyle: CSSProperties = {
    width:
        '100%',

    borderCollapse:
        'collapse',

    minWidth:
        760,
};

const thStyle: CSSProperties = {
    textAlign:
        'left',

    padding:
        '12px 14px',

    fontSize:
        11,

    color:
        '#7e8a98',

    fontWeight:
        700,

    textTransform:
        'uppercase',

    letterSpacing:
        '.06em',

    borderBottom:
        '1px solid rgba(255,255,255,.08)',
};

const centerThStyle: CSSProperties = {
    ...thStyle,

    textAlign:
        'center',
};

const tdStyle: CSSProperties = {
    padding:
        '14px',

    borderBottom:
        '1px solid rgba(255,255,255,.06)',

    verticalAlign:
        'middle',

    color:
        '#d9e1ea',

    fontSize:
        13,
};

const inputStyle: CSSProperties = {
    width:
        '100%',

    minHeight:
        52,

    boxSizing:
        'border-box',

    borderRadius:
        11,

    border:
        '1px solid #303a49',

    background:
        '#1a2332',

    color:
        '#f8fafc',

    outline:
        'none',

    padding:
        '12px 15px',

    fontSize:
        14,
};

const fieldStyle: CSSProperties = {
    display:
        'grid',

    gap:
        8,

    fontWeight:
        700,

    color:
        '#e5e7eb',

    fontSize:
        14,
};

const passwordWrapperStyle: CSSProperties = {
    position:
        'relative',

    display:
        'flex',

    alignItems:
        'center',
};

const passwordToggleStyle: CSSProperties = {
    position:
        'absolute',

    right:
        8,

    width:
        38,

    height:
        38,

    display:
        'grid',

    placeItems:
        'center',

    border:
        'none',

    borderRadius:
        9,

    background:
        'transparent',

    color:
        '#91a0b2',

    cursor:
        'pointer',
};

const dropdownWrapperStyle: CSSProperties = {
    position:
        'relative',

    width:
        '100%',
};

const dropdownButtonStyle: CSSProperties = {
    width:
        '100%',

    minHeight:
        58,

    padding:
        '10px 14px',

    display:
        'flex',

    alignItems:
        'center',

    justifyContent:
        'space-between',

    gap:
        15,

    border:
        '1px solid #303a49',

    borderRadius:
        11,

    background:
        '#1a2332',

    color:
        '#f8fafc',

    cursor:
        'pointer',

    transition:
        'border-color .16s ease, box-shadow .16s ease, background .16s ease',
};

const dropdownMenuStyle: CSSProperties = {
    position:
        'absolute',

    top:
        'calc(100% + 8px)',

    left:
        0,

    right:
        0,

    zIndex:
        1200,

    padding:
        7,

    border:
        '1px solid #303b4b',

    borderRadius:
        12,

    background:
        '#111a27',

    boxShadow:
        '0 20px 50px rgba(0,0,0,.5)',
};

const dropdownOptionStyle: CSSProperties = {
    width:
        '100%',

    display:
        'flex',

    alignItems:
        'center',

    justifyContent:
        'space-between',

    gap:
        15,

    padding:
        '11px 12px',

    border:
        '1px solid transparent',

    borderRadius:
        9,

    color:
        '#f8fafc',

    cursor:
        'pointer',
};

const overlayStyle: CSSProperties = {
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
};

const modalStyle: CSSProperties = {
    width:
        'min(650px, 96vw)',

    maxHeight:
        '90vh',

    overflowY:
        'auto',

    borderRadius:
        20,

    border:
        '1px solid #263245',

    background:
        '#111a2a',

    padding:
        24,

    boxShadow:
        '0 30px 100px rgba(0,0,0,.55)',
};

const modalHeaderStyle: CSSProperties = {
    display:
        'flex',

    justifyContent:
        'space-between',

    alignItems:
        'center',

    gap:
        16,

    marginBottom:
        24,
};

const modalFooterStyle: CSSProperties = {
    display:
        'flex',

    justifyContent:
        'flex-end',

    gap:
        10,

    marginTop:
        24,
};

const accessHeaderStyle: CSSProperties = {
    display:
        'flex',

    justifyContent:
        'space-between',

    gap:
        16,

    alignItems:
        'center',

    flexWrap:
        'wrap',

    marginBottom:
        18,
};

const iconButtonStyle: CSSProperties = {
    width:
        42,

    height:
        42,

    border:
        '1px solid rgba(255,255,255,.04)',

    borderRadius:
        11,

    display:
        'grid',

    placeItems:
        'center',

    cursor:
        'pointer',

    color:
        '#d8e0ea',

    background:
        'rgba(255,255,255,.06)',
};

const emptyStateStyle: CSSProperties = {
    padding:
        34,

    textAlign:
        'center',

    color:
        '#7e8a98',
};

const messageStyle: CSSProperties = {
    padding:
        '13px 15px',

    borderRadius:
        12,

    border:
        '1px solid rgba(255,255,255,.1)',

    marginBottom:
        16,
};

const roleBadgeStyle: CSSProperties = {
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
        12,

    fontWeight:
        700,
};

const statusBadgeStyle: CSSProperties = {
    display:
        'inline-flex',

    padding:
        '5px 9px',

    borderRadius:
        999,

    background:
        'rgba(74,222,128,.1)',

    border:
        '1px solid rgba(74,222,128,.18)',

    color:
        '#86efac',

    fontSize:
        12,

    fontWeight:
        700,
};
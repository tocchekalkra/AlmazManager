import {
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Boxes,
    ClipboardCheck,
    FileText,
    Gauge,
    History,
    Layers3,
    Package,
    Settings,
    SwatchBook,
    Users,
} from 'lucide-react';

import {
    NavLink,
} from 'react-router-dom';

import {
    getUserFromToken,
} from '../../auth/token';

import api from '../../api/api';

type CurrentUserAccess = {
    canInventoryStandard: boolean;
    canInventoryOracal: boolean;
};

type SidebarItem = {
    to: string;
    label: string;
    icon: typeof Gauge;

    administratorOnly?: boolean;

    permission?:
    | 'inventoryStandard'
    | 'inventoryOracal';
};

type SidebarSection = {
    title: string;

    administratorOnly?: boolean;

    items: SidebarItem[];
};

const sections: SidebarSection[] = [
    {
        title: '',

        items: [
            {
                to: '/',
                label: 'Обзор',
                icon: Gauge,
            },
        ],
    },

    {
        title: 'СКЛАД',

        items: [
            {
                to: '/stock',
                label: 'Склад',
                icon: Boxes,
            },

            {
                to: '/materials',
                label: 'Материалы',
                icon: Package,
            },

            {
                to: '/categories',
                label: 'Категории',
                icon: Layers3,

                administratorOnly:
                    true,
            },
        ],
    },

    {
        title: 'ОПЕРАЦИИ',

        items: [
            {
                to: '/receiving',
                label: 'Приход',
                icon: ArrowDownToLine,
            },

            {
                to: '/issue',
                label: 'Расход',
                icon: ArrowUpFromLine,
            },

            {
                to: '/inventory',
                label:
                    'Инвентаризация склада',

                icon:
                    ClipboardCheck,

                permission:
                    'inventoryStandard',
            },

            {
                to: '/inventory/oracal',
                label:
                    'Инвентаризация ORACAL',

                icon:
                    SwatchBook,

                permission:
                    'inventoryOracal',
            },
        ],
    },

    {
        title: 'ДОКУМЕНТЫ',

        items: [
            {
                to: '/documents',
                label: 'Документы',
                icon: FileText,
            },

            {
                to: '/operations',
                label:
                    'Журнал операций',

                icon:
                    History,
            },
        ],
    },

    {
        title: 'СИСТЕМА',

        administratorOnly:
            true,

        items: [
            {
                to: '/users',
                label:
                    'Пользователи',

                icon:
                    Users,
            },

            {
                to: '/settings',
                label:
                    'Настройки',

                icon:
                    Settings,
            },
        ],
    },
];

export default function Sidebar() {
    const token =
        localStorage.getItem(
            'almazmanager_token',
        );

    const user =
        token
            ? getUserFromToken(
                token,
            )
            : null;

    const isAdministrator =
        user?.role ===
        'Administrator';

    const [
        access,
        setAccess,
    ] =
        useState<CurrentUserAccess>({
            canInventoryStandard:
                isAdministrator,

            canInventoryOracal:
                isAdministrator,
        });

    const [
        accessLoaded,
        setAccessLoaded,
    ] =
        useState(
            isAdministrator,
        );

    useEffect(() => {
        if (!token) {
            setAccess({
                canInventoryStandard:
                    false,

                canInventoryOracal:
                    false,
            });

            setAccessLoaded(
                true,
            );

            return;
        }

        if (isAdministrator) {
            setAccess({
                canInventoryStandard:
                    true,

                canInventoryOracal:
                    true,
            });

            setAccessLoaded(
                true,
            );

            return;
        }

        let cancelled =
            false;

        async function loadAccess() {
            try {
                setAccessLoaded(
                    false,
                );

                const response =
                    await api.get<CurrentUserAccess>(
                        '/users/me/access',
                    );

                if (cancelled) {
                    return;
                }

                setAccess({
                    canInventoryStandard:
                        response.data
                            .canInventoryStandard,

                    canInventoryOracal:
                        response.data
                            .canInventoryOracal,
                });
            } catch (
            requestError
            ) {
                console.error(
                    'Не удалось загрузить права текущего пользователя:',
                    requestError,
                );

                if (cancelled) {
                    return;
                }

                /*
                 * Если API прав недоступен,
                 * безопаснее скрыть защищённые
                 * пункты меню.
                 */
                setAccess({
                    canInventoryStandard:
                        false,

                    canInventoryOracal:
                        false,
                });
            } finally {
                if (!cancelled) {
                    setAccessLoaded(
                        true,
                    );
                }
            }
        }

        void loadAccess();

        return () => {
            cancelled =
                true;
        };
    }, [
        token,
        isAdministrator,
    ]);

    function hasItemAccess(
        item: SidebarItem,
    ) {
        if (
            item.administratorOnly &&
            !isAdministrator
        ) {
            return false;
        }

        if (
            !item.permission
        ) {
            return true;
        }

        /*
         * Администратор имеет
         * полный доступ.
         */
        if (isAdministrator) {
            return true;
        }

        /*
         * Пока права загружаются,
         * защищённые пункты не показываем.
         */
        if (!accessLoaded) {
            return false;
        }

        if (
            item.permission ===
            'inventoryStandard'
        ) {
            return access
                .canInventoryStandard;
        }

        if (
            item.permission ===
            'inventoryOracal'
        ) {
            return access
                .canInventoryOracal;
        }

        return false;
    }

    const visibleSections =
        useMemo(
            () =>
                sections
                    .filter(
                        section =>
                            !section.administratorOnly ||
                            isAdministrator,
                    )
                    .map(
                        section => ({
                            ...section,

                            items:
                                section.items.filter(
                                    hasItemAccess,
                                ),
                        }),
                    )
                    .filter(
                        section =>
                            section.items.length >
                            0,
                    ),
            [
                isAdministrator,
                accessLoaded,
                access.canInventoryStandard,
                access.canInventoryOracal,
            ],
        );

    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-mark">
                    W
                </div>

                <div className="brand-copy">
                    <div className="brand-title">
                        Almaz
                        <span>
                            Manager
                        </span>
                    </div>

                    <div className="brand-subtitle">
                        система складского
                        учёта
                    </div>
                </div>
            </div>

            <nav className="sidebar-navigation">
                {visibleSections.map(
                    (
                        section,
                        index,
                    ) => (
                        <div
                            className="sidebar-section"
                            key={`${section.title}-${index}`}
                        >
                            {section.title && (
                                <div className="sidebar-section-title">
                                    {
                                        section.title
                                    }
                                </div>
                            )}

                            {section.items.map(
                                item => {
                                    const Icon =
                                        item.icon;

                                    return (
                                        <NavLink
                                            key={
                                                item.to
                                            }
                                            to={
                                                item.to
                                            }

                                            /*
                                             * Точное совпадение маршрута.
                                             *
                                             * /inventory
                                             * не подсвечивается на
                                             * /inventory/oracal
                                             */
                                            end
                                            className={({
                                                isActive,
                                            }) =>
                                                `sidebar-link ${isActive
                                                    ? 'sidebar-link-active'
                                                    : ''
                                                }`
                                            }
                                        >
                                            <Icon
                                                size={
                                                    20
                                                }
                                                strokeWidth={
                                                    1.8
                                                }
                                            />

                                            <span>
                                                {
                                                    item.label
                                                }
                                            </span>
                                        </NavLink>
                                    );
                                },
                            )}
                        </div>
                    ),
                )}
            </nav>
        </aside>
    );
}
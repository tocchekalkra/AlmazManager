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

type SidebarItem = {
    to: string;
    label: string;
    icon: typeof Gauge;

    administratorOnly?: boolean;
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
                icon: ClipboardCheck,
            },

            {
                to: '/inventory/oracal',
                label:
                    'Инвентаризация ORACAL',
                icon: SwatchBook,
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
                icon: History,
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
                label: 'Пользователи',
                icon: Users,
            },

            {
                to: '/settings',
                label: 'Настройки',
                icon: Settings,
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

    const visibleSections =
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
                            item =>
                                !item.administratorOnly ||
                                isAdministrator,
                        ),
                }),
            )
            .filter(
                section =>
                    section.items.length >
                    0,
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
                                             * ВАЖНО:
                                             * end заставляет NavLink
                                             * подсвечиваться только при
                                             * точном совпадении маршрута.
                                             *
                                             * Поэтому:
                                             *
                                             * /inventory
                                             *
                                             * больше НЕ будет активным
                                             * на:
                                             *
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
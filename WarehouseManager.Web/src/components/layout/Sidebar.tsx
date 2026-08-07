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
    Users,
} from 'lucide-react';

import { NavLink } from 'react-router-dom';

const sections = [
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
                label: 'Инвентаризация',
                icon: ClipboardCheck,
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
                label: 'Журнал операций',
                icon: History,
            },
        ],
    },
    {
        title: 'СИСТЕМА',
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
    return (
        <aside className="sidebar">
            <div className="brand">
                <div className="brand-mark">W</div>

                <div className="brand-copy">
                    <div className="brand-title">
                        Warehouse<span>Manager</span>
                    </div>

                    <div className="brand-subtitle">
                        система складского учёта
                    </div>
                </div>
            </div>

            <nav className="sidebar-navigation">
                {sections.map((section, index) => (
                    <div
                        className="sidebar-section"
                        key={`${section.title}-${index}`}
                    >
                        {section.title && (
                            <div className="sidebar-section-title">
                                {section.title}
                            </div>
                        )}

                        {section.items.map((item) => {
                            const Icon = item.icon;

                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.to === '/'}
                                    className={({ isActive }) =>
                                        `sidebar-link ${isActive ? 'sidebar-link-active' : ''
                                        }`
                                    }
                                >
                                    <Icon size={20} strokeWidth={1.8} />
                                    <span>{item.label}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                ))}
            </nav>
        </aside>
    );
}
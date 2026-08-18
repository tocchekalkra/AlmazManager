import { Bell, ChevronDown, LogOut, Monitor, Moon, Settings, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../../api/api';
import { useAuth } from '../../auth/AuthContext';
import { useTheme, type ThemeMode } from '../../theme/ThemeContext';

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    materialId?: string | null;
    supplyInvoiceId?: string | null;
    createdAtUtc: string;
    readAtUtc?: string | null;
};

type NotificationList = {
    unreadCount: number;
    items: NotificationItem[];
};

export default function Topbar() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { mode, setMode } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationList>({ unreadCount: 0, items: [] });

    const displayName = user?.name ?? 'Пользователь';
    const firstLetter = displayName.charAt(0).toUpperCase();

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const response = await api.get<NotificationList>('/notifications');
                if (!cancelled) setNotifications(response.data);
            } catch {
                // Уведомления не должны блокировать основной интерфейс.
            }
        }

        void load();
        const timer = window.setInterval(load, 60_000);
        return () => { cancelled = true; window.clearInterval(timer); };
    }, []);

    async function markRead(item: NotificationItem) {
        if (!item.readAtUtc) {
            await api.post(`/notifications/${item.id}/read`);
            setNotifications((current) => ({
                unreadCount: Math.max(0, current.unreadCount - 1),
                items: current.items.map((entry) => entry.id === item.id
                    ? { ...entry, readAtUtc: new Date().toISOString() }
                    : entry),
            }));
        }

        setNotificationsOpen(false);
        if (item.supplyInvoiceId) navigate(`/supplies?invoice=${item.supplyInvoiceId}`);
        else if (item.materialId) navigate(`/stock?material=${item.materialId}`);
    }

    async function cycleTheme() {
        const next: ThemeMode = mode === 'Dark' ? 'Light' : mode === 'Light' ? 'System' : 'Dark';
        await setMode(next);
    }

    function handleLogout() {
        logout();
        navigate('/login', { replace: true });
    }

    const ThemeIcon = mode === 'Dark' ? Moon : mode === 'Light' ? Sun : Monitor;

    return (
        <header className="topbar">
            <div className="topbar-context">
                <strong>Склад рекламного производства</strong>
                <span>Единый журнал движения материалов</span>
            </div>

            <div className="topbar-actions">
                <button className="icon-button" type="button" title={`Тема: ${themeLabel(mode)}`} onClick={() => void cycleTheme()}>
                    <ThemeIcon size={19} />
                </button>

                <div className="notification-wrapper">
                    <button className="icon-button" type="button" title="Уведомления" onClick={() => setNotificationsOpen((value) => !value)}>
                        <Bell size={19} />
                        {notifications.unreadCount > 0 && <span className="notification-badge">{notifications.unreadCount}</span>}
                    </button>

                    {notificationsOpen && (
                        <div className="notification-menu">
                            <div className="notification-menu-header">
                                <strong>Уведомления</strong>
                                <span>{notifications.unreadCount} непрочитанных</span>
                            </div>
                            {notifications.items.slice(0, 8).map((item) => (
                                <button key={item.id} type="button" className={item.readAtUtc ? '' : 'unread'} onClick={() => void markRead(item)}>
                                    <strong>{item.title}</strong>
                                    <span>{item.message}</span>
                                    <small>{new Date(item.createdAtUtc).toLocaleString('ru-RU')}</small>
                                </button>
                            ))}
                            {notifications.items.length === 0 && <div className="notification-empty">Новых уведомлений нет</div>}
                        </div>
                    )}
                </div>

                <div className="profile-wrapper">
                    <button className="profile-button" type="button" onClick={() => setMenuOpen((value) => !value)}>
                        <div className="profile-avatar">{firstLetter}<span className="online-dot" /></div>
                        <div className="profile-copy"><strong>{displayName}</strong><span>{roleLabel(user?.role)}</span></div>
                        <ChevronDown size={16} />
                    </button>

                    {menuOpen && (
                        <div className="profile-menu">
                            <button type="button" onClick={() => navigate('/settings')}><Settings size={16} />Настройки</button>
                            <button type="button" onClick={handleLogout}><LogOut size={16} />Выйти</button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function themeLabel(mode: ThemeMode) {
    return mode === 'Dark' ? 'тёмная' : mode === 'Light' ? 'светлая' : 'как в системе';
}

function roleLabel(role?: string) {
    return ({ Administrator: 'Администратор', Printer: 'Печатник', PlotterOperator: 'Оператор плоттера', Viewer: 'Наблюдатель' } as Record<string, string>)[role ?? ''] ?? 'Пользователь';
}

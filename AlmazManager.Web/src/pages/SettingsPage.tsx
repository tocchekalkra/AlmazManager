import { CheckCircle2, GripVertical, Lock, Monitor, Moon, RefreshCcw, RotateCcw, Server, Sun, Unlock } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import api from '../api/api';
import { useTheme, type ThemeMode } from '../theme/ThemeContext';

type CurrentUser = { userId: string; fullName: string; login: string; role: string };
type Category = { id: string; name: string; isActive: boolean };

export default function SettingsPage() {
    const { mode, setMode } = useTheme();
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [categories, setCategories] = useState<Category[]>([]);
    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [orderMode, setOrderMode] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => { void checkSystem(); }, []);

    async function checkSystem() {
        try {
            setStatus('checking');
            const [userResponse, categoryResponse] = await Promise.all([
                api.get<CurrentUser>('/auth/me'),
                api.get<Category[]>('/categories'),
            ]);
            setUser(userResponse.data);
            setCategories(categoryResponse.data.filter((item) => item.isActive));
            setStatus('online');
        } catch { setStatus('offline'); }
    }

    async function dropCategory(targetId: string) {
        if (!orderMode || !draggedId || draggedId === targetId) return;
        const next = [...categories];
        const from = next.findIndex((item) => item.id === draggedId);
        const to = next.findIndex((item) => item.id === targetId);
        const [moved] = next.splice(from, 1); next.splice(to, 0, moved);
        setCategories(next); setDraggedId(null);
        await api.put('/preferences', { categoryOrder: next.map((item) => item.id) });
        setMessage('Порядок категорий сохранён.');
    }

    async function resetOrder() {
        await api.put('/preferences', { resetOrder: true });
        setMessage('Пользовательский порядок материалов и категорий сброшен.');
        await checkSystem();
    }

    return (
        <div className="page">
            <div className="page-heading"><div><p className="eyebrow">SETTINGS</p><h1>Настройки</h1><p>Оформление и личный порядок каталога.</p></div><button className="button secondary" type="button" onClick={() => void checkSystem()}><RefreshCcw size={17} />Проверить</button></div>
            {message && <div className="form-message success">{message}</div>}

            <section className="settings-grid">
                <article className="panel settings-section">
                    <div className="panel-header"><div><h2>Тема оформления</h2><p>Синхронизируется между Web и Android</p></div></div>
                    <div className="theme-options">
                        <ThemeButton icon={<Moon />} label="Тёмная" value="Dark" current={mode} onChange={setMode} />
                        <ThemeButton icon={<Sun />} label="Светлая" value="Light" current={mode} onChange={setMode} />
                        <ThemeButton icon={<Monitor />} label="Как в системе" value="System" current={mode} onChange={setMode} />
                    </div>
                </article>

                <article className="panel settings-section">
                    <div className="panel-header"><div><h2>Состояние системы</h2><p>Текущее подключение</p></div></div>
                    <div className="system-status-card"><span className="settings-icon"><Server size={22} /></span><div><small>Backend API</small><strong className={status === 'offline' ? 'bad-text' : 'good-text'}>{status === 'checking' ? 'Проверка...' : status === 'online' ? 'Доступен' : 'Нет связи'}</strong></div></div>
                    <div className="system-status-card"><span className="settings-icon"><CheckCircle2 size={22} /></span><div><small>Пользователь</small><strong>{user ? `${user.fullName} · ${roleLabel(user.role)}` : '—'}</strong></div></div>
                </article>
            </section>

            <section className="panel settings-section" style={{ marginTop: 15 }}>
                <div className="panel-header"><div><h2>Порядок категорий</h2><p>{orderMode ? 'Режим перемещения включён. Изменения сохраняются только для вас.' : 'Перемещение заблокировано от случайных действий.'}</p></div><div className="heading-actions"><button className={orderMode ? 'button primary' : 'button secondary'} type="button" onClick={() => { setOrderMode(value => !value); setDraggedId(null); }}>{orderMode ? <Lock size={15} /> : <Unlock size={15} />}{orderMode ? 'Завершить порядок' : 'Изменить порядок'}</button><button className="button secondary" type="button" onClick={() => void resetOrder()}><RotateCcw size={15} />Вернуть по умолчанию</button></div></div>
                <div className="order-list">{categories.map((category) => <div key={category.id} draggable={orderMode} onDragStart={() => setDraggedId(category.id)} onDragOver={(event) => orderMode && event.preventDefault()} onDrop={() => void dropCategory(category.id)}>{orderMode ? <GripVertical size={17} /> : <Lock size={15} />}<span>{category.name}</span></div>)}</div>
            </section>
        </div>
    );
}

function ThemeButton({ icon, label, value, current, onChange }: { icon: ReactNode; label: string; value: ThemeMode; current: ThemeMode; onChange: (value: ThemeMode) => Promise<void> }) {
    return <button type="button" className={current === value ? 'theme-option selected' : 'theme-option'} onClick={() => void onChange(value)}>{icon}<strong>{label}</strong>{current === value && <CheckCircle2 size={16} />}</button>;
}

function roleLabel(role: string) { return ({ Administrator: 'Администратор', Printer: 'Печатник', PlotterOperator: 'Оператор плоттера', Viewer: 'Наблюдатель' } as Record<string, string>)[role] ?? role; }

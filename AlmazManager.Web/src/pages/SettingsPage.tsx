import {
    useEffect,
    useState,
    type CSSProperties,
} from 'react';

import {
    CheckCircle2,
    RefreshCcw,
    Server,
    ShieldCheck,
} from 'lucide-react';

import api from '../api/api';

type CurrentUser = {
    userId: string;
    fullName: string;
    login: string;
    role: string;
};

export default function SettingsPage() {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    useEffect(() => {
        void checkSystem();
    }, []);

    async function checkSystem() {
        try {
            setStatus('checking');
            const response = await api.get<CurrentUser>('/auth/me');
            setUser(response.data);
            setStatus('online');
        } catch {
            setStatus('offline');
        }
    }

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">SYSTEM</p>
                    <h1>Настройки</h1>
                    <p>Состояние системы и параметры текущего подключения.</p>
                </div>

                <button
                    type="button"
                    className="button secondary"
                    onClick={() => void checkSystem()}
                >
                    <RefreshCcw size={17} />
                    Проверить
                </button>
            </div>

            <section style={styles.grid}>
                <article className="panel" style={styles.card}>
                    <div style={styles.icon}><Server size={22} /></div>
                    <div>
                        <div style={styles.label}>Backend API</div>
                        <strong style={status === 'offline' ? styles.bad : styles.good}>
                            {status === 'checking'
                                ? 'Проверка...'
                                : status === 'online'
                                    ? 'Доступен'
                                    : 'Нет связи'}
                        </strong>
                    </div>
                </article>

                <article className="panel" style={styles.card}>
                    <div style={styles.icon}><ShieldCheck size={22} /></div>
                    <div>
                        <div style={styles.label}>Авторизация</div>
                        <strong>{user ? `${user.fullName} · ${user.role}` : '—'}</strong>
                    </div>
                </article>

                <article className="panel" style={styles.card}>
                    <div style={styles.icon}><CheckCircle2 size={22} /></div>
                    <div>
                        <div style={styles.label}>Режим склада</div>
                        <strong>Централизованный REST API</strong>
                    </div>
                </article>
            </section>

            <section className="panel" style={{ marginTop: 16 }}>
                <div className="panel-header">
                    <div>
                        <h2>О системе</h2>
                        <p>AlmazManager · Web / API / PostgreSQL / Android</p>
                    </div>
                </div>

                <div style={styles.infoList}>
                    <div><span>Пользователь</span><strong>{user?.login ?? '—'}</strong></div>
                    <div><span>Роль</span><strong>{user?.role ?? '—'}</strong></div>
                    <div><span>Изменение остатков</span><strong>Только через складские документы</strong></div>
                    <div><span>Аудит</span><strong>Включён для всех движений</strong></div>
                </div>
            </section>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 14,
    },
    card: {
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minHeight: 105,
    },
    icon: {
        width: 46,
        height: 46,
        borderRadius: 13,
        display: 'grid',
        placeItems: 'center',
        background: 'rgba(74,166,255,.1)',
        color: '#4aa6ff',
    },
    label: { color: '#7f8a9b', fontSize: 12, marginBottom: 5 },
    good: { color: '#54d99c' },
    bad: { color: '#ff7f8b' },
    infoList: { display: 'grid', gap: 0 },
};

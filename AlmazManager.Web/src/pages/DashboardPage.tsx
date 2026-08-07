import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpFromLine,
    Boxes,
    ClipboardCheck,
    FileText,
    Package,
    Plus,
} from 'lucide-react';

const attentionRows = [
    {
        name: 'Плёнка Orajet 3640',
        article: 'ORA-3640',
        category: 'Плёнки',
        stock: '3 м',
        minimum: '5 м',
        status: 'Низкий остаток',
        tone: 'warning',
    },
    {
        name: 'Баннер 440 г/м²',
        article: 'BAN-440',
        category: 'Баннеры',
        stock: '18 м²',
        minimum: '20 м²',
        status: 'Низкий остаток',
        tone: 'warning',
    },
    {
        name: 'Саморез 4,2×16',
        article: 'SCR-4216',
        category: 'Крепёж',
        stock: '0 шт.',
        minimum: '500 шт.',
        status: 'Нет в наличии',
        tone: 'danger',
    },
];

const operations = [
    {
        time: '14:52',
        type: 'Расход',
        material: 'Плёнка Orajet 3640',
        delta: '−2 м',
        tone: 'danger',
    },
    {
        time: '14:31',
        type: 'Инвентаризация',
        material: 'Баннер 440 г/м²',
        delta: '+2 м²',
        tone: 'info',
    },
    {
        time: '12:05',
        type: 'Приход',
        material: 'Плёнка Orajet 3640',
        delta: '+5 м',
        tone: 'success',
    },
];

export default function DashboardPage() {
    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">WAREHOUSE OVERVIEW</p>
                    <h1>Добрый день, Администратор</h1>
                    <p>Вот что происходит на складе сегодня.</p>
                </div>

                <div className="date-card">
                    <strong>7 августа 2026</strong>
                    <span>Склад работает</span>
                </div>
            </div>

            <section className="stats-grid">
                <StatCard
                    icon={<Boxes />}
                    value="1 284"
                    label="Материалов"
                    hint="+12 за неделю"
                    tone="blue"
                />

                <StatCard
                    icon={<AlertTriangle />}
                    value="12"
                    label="Низкий остаток"
                    hint="Требуют внимания"
                    tone="amber"
                />

                <StatCard
                    icon={<Package />}
                    value="3"
                    label="Нет в наличии"
                    hint="Нужно пополнить"
                    tone="red"
                />

                <StatCard
                    icon={<FileText />}
                    value="8"
                    label="Документов сегодня"
                    hint="+2 к вчерашнему дню"
                    tone="green"
                />
            </section>

            <div className="dashboard-layout">
                <div className="dashboard-main-column">
                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>Требуют внимания</h2>
                                <p>Материалы ниже минимального остатка</p>
                            </div>

                            <button className="text-button" type="button">
                                Смотреть все
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
                                        <th>Мин.</th>
                                        <th>Статус</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {attentionRows.map((row) => (
                                        <tr key={row.article}>
                                            <td className="primary-cell">{row.name}</td>
                                            <td>{row.article}</td>
                                            <td>{row.category}</td>
                                            <td>{row.stock}</td>
                                            <td>{row.minimum}</td>
                                            <td>
                                                <span className={`status status-${row.tone}`}>
                                                    <span className="status-dot" />
                                                    {row.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>Последние операции</h2>
                                <p>Недавние изменения складских остатков</p>
                            </div>

                            <button className="text-button" type="button">
                                Перейти в журнал
                            </button>
                        </div>

                        <div className="operation-list">
                            {operations.map((operation) => (
                                <div
                                    className="operation-row"
                                    key={`${operation.time}-${operation.material}`}
                                >
                                    <span className="operation-time">
                                        {operation.time}
                                    </span>

                                    <span
                                        className={`operation-type operation-${operation.tone}`}
                                    >
                                        {operation.type}
                                    </span>

                                    <div className="operation-material">
                                        <strong>{operation.material}</strong>
                                        <span>{operation.delta}</span>
                                    </div>

                                    <div className="operation-user">
                                        Администратор
                                        <span>admin</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="dashboard-side-column">
                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>Быстрые действия</h2>
                                <p>Основные операции склада</p>
                            </div>
                        </div>

                        <div className="quick-actions">
                            <QuickAction
                                icon={<ArrowDownToLine />}
                                title="Приход"
                                subtitle="Создать приход"
                                tone="success"
                            />

                            <QuickAction
                                icon={<ArrowUpFromLine />}
                                title="Расход"
                                subtitle="Создать расход"
                                tone="danger"
                            />

                            <QuickAction
                                icon={<ClipboardCheck />}
                                title="Инвентаризация"
                                subtitle="Новый документ"
                                tone="info"
                            />

                            <QuickAction
                                icon={<Plus />}
                                title="Материал"
                                subtitle="Добавить материал"
                                tone="blue"
                            />
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>Состояние склада</h2>
                                <p>Общая сводка</p>
                            </div>
                        </div>

                        <div className="warehouse-health">
                            <div className="health-circle">
                                <strong>93%</strong>
                                <span>в норме</span>
                            </div>

                            <div className="health-list">
                                <div>
                                    <span>В наличии</span>
                                    <strong>1 269</strong>
                                </div>

                                <div>
                                    <span>Низкий остаток</span>
                                    <strong>12</strong>
                                </div>

                                <div>
                                    <span>Отсутствуют</span>
                                    <strong>3</strong>
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function StatCard({
    icon,
    value,
    label,
    hint,
    tone,
}: {
    icon: React.ReactNode;
    value: string;
    label: string;
    hint: string;
    tone: string;
}) {
    return (
        <article className={`stat-card stat-${tone}`}>
            <div className="stat-icon">{icon}</div>

            <div>
                <strong className="stat-value">{value}</strong>
                <span className="stat-label">{label}</span>
                <small>{hint}</small>
            </div>
        </article>
    );
}

function QuickAction({
    icon,
    title,
    subtitle,
    tone,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    tone: string;
}) {
    return (
        <button
            className={`quick-action quick-${tone}`}
            type="button"
        >
            {icon}
            <strong>{title}</strong>
            <span>{subtitle}</span>
        </button>
    );
}
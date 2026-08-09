import { useEffect, useState } from 'react';
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

import { useNavigate } from 'react-router-dom';

import api from '../api/api';
import { useAuth } from '../auth/AuthContext';

type AttentionMaterial = {
    materialId: string;
    name: string;
    article: string;
    category: string;
    quantity: number;
    minimumQuantity: number;
    unit: string;
    status: string;
};

type RecentOperation = {
    operationId: string;
    createdAtUtc: string;
    type: string;
    materialName: string;
    quantityChange: number;
    unit: string;
    userId: string;
    userFullName: string;
    userLogin: string;
};

type DashboardResponse = {
    totalMaterials: number;
    activeMaterials: number;
    totalCategories: number;
    totalQuantity: number;
    materialsWithStock: number;
    materialsWithoutStock: number;
    belowMinimumCount: number;
    totalOperations: number;
    receivingOperations: number;
    issueOperations: number;
    inventoryOperations: number;
    receivingToday: number;
    issueToday: number;
    attentionMaterials: AttentionMaterial[];
    recentOperations: RecentOperation[];
};

const numberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 2,
});

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboard, setDashboard] =
        useState<DashboardResponse | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            try {
                setLoading(true);
                setError('');

                const response =
                    await api.get<DashboardResponse>('/dashboard');

                if (!cancelled) {
                    setDashboard(response.data);
                }
            } catch (requestError) {
                console.error(
                    'Ошибка загрузки Dashboard:',
                    requestError,
                );

                if (!cancelled) {
                    setError(
                        'Не удалось получить данные склада. Проверьте API и PostgreSQL.',
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    const healthPercent =
        dashboard && dashboard.activeMaterials > 0
            ? Math.round(
                (dashboard.materialsWithStock /
                    dashboard.activeMaterials) *
                100,
            )
            : 0;

    /*
     * belowMinimumCount включает материалы с нулевым остатком.
     * Для сводки справа отделяем:
     * - низкий остаток
     * - полностью отсутствующие
     */
    const lowStockOnly = dashboard
        ? Math.max(
            dashboard.belowMinimumCount -
            dashboard.materialsWithoutStock,
            0,
        )
        : 0;

    const currentDate = new Intl.DateTimeFormat('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(new Date());

    const displayNumber = (value?: number) => {
        if (loading) {
            return '—';
        }

        return numberFormatter.format(value ?? 0);
    };

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        WAREHOUSE OVERVIEW
                    </p>

                    <h1>
                        Добрый день, {user?.name ?? 'сотрудник'}
                    </h1>

                    <p>
                        Вот что происходит на складе сегодня.
                    </p>
                </div>

                <div className="date-card">
                    <strong>{currentDate}</strong>

                    <span>
                        {error
                            ? 'Нет связи со складом'
                            : 'Склад работает'}
                    </span>
                </div>
            </div>

            {error && (
                <section
                    className="panel"
                    style={{
                        marginBottom: '20px',
                    }}
                >
                    <div className="panel-header">
                        <div>
                            <h2>Ошибка загрузки</h2>
                            <p>{error}</p>
                        </div>
                    </div>
                </section>
            )}

            <section className="stats-grid">
                <StatCard
                    icon={<Boxes />}
                    value={displayNumber(
                        dashboard?.totalMaterials,
                    )}
                    label="Материалов"
                    hint={
                        dashboard
                            ? `Активных: ${numberFormatter.format(
                                dashboard.activeMaterials,
                            )}`
                            : 'Загрузка данных'
                    }
                    tone="blue"
                />

                <StatCard
                    icon={<AlertTriangle />}
                    value={displayNumber(
                        dashboard?.belowMinimumCount,
                    )}
                    label="Требуют внимания"
                    hint="Остаток ниже минимального"
                    tone="amber"
                />

                <StatCard
                    icon={<Package />}
                    value={displayNumber(
                        dashboard?.materialsWithoutStock,
                    )}
                    label="Нет в наличии"
                    hint="Нужно пополнить"
                    tone="red"
                />

                <StatCard
                    icon={<FileText />}
                    value={displayNumber(
                        dashboard?.totalOperations,
                    )}
                    label="Всего операций"
                    hint={
                        dashboard
                            ? `${numberFormatter.format(
                                dashboard.receivingOperations,
                            )} приходов`
                            : 'Загрузка данных'
                    }
                    tone="green"
                />
            </section>

            <div className="dashboard-layout">
                <div className="dashboard-main-column">
                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>
                                    Требуют внимания
                                </h2>

                                <p>
                                    Материалы ниже минимального
                                    остатка
                                </p>
                            </div>

                            <button
                                className="text-button"
                                type="button"
                                onClick={() => navigate('/stock')}
                            >
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
                                    {loading && (
                                        <tr>
                                            <td colSpan={6}>
                                                Загрузка данных...
                                            </td>
                                        </tr>
                                    )}

                                    {!loading &&
                                        dashboard
                                            ?.attentionMaterials
                                            .length === 0 && (
                                            <tr>
                                                <td colSpan={6}>
                                                    Все материалы
                                                    находятся в норме.
                                                </td>
                                            </tr>
                                        )}

                                    {!loading &&
                                        dashboard?.attentionMaterials.map(
                                            (material) => (
                                                <tr
                                                    key={
                                                        material.materialId
                                                    }
                                                >
                                                    <td className="primary-cell">
                                                        {
                                                            material.name
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            material.article
                                                        }
                                                    </td>

                                                    <td>
                                                        {
                                                            material.category
                                                        }
                                                    </td>

                                                    <td>
                                                        {formatQuantity(
                                                            material.quantity,
                                                            material.unit,
                                                        )}
                                                    </td>

                                                    <td>
                                                        {formatQuantity(
                                                            material.minimumQuantity,
                                                            material.unit,
                                                        )}
                                                    </td>

                                                    <td>
                                                        <MaterialStatus
                                                            status={
                                                                material.status
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ),
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>
                                    Последние операции
                                </h2>

                                <p>
                                    Недавние изменения складских
                                    остатков
                                </p>
                            </div>

                            <button
                                className="text-button"
                                type="button"
                                onClick={() => navigate('/operations')}
                            >
                                Перейти в журнал
                            </button>
                        </div>

                        <div className="operation-list">
                            {loading && (
                                <div className="operation-row">
                                    Загрузка операций...
                                </div>
                            )}

                            {!loading &&
                                dashboard?.recentOperations
                                    .length === 0 && (
                                    <div className="operation-row">
                                        Операций пока нет.
                                    </div>
                                )}

                            {!loading &&
                                dashboard?.recentOperations.map(
                                    (operation) => {
                                        const operationView =
                                            getOperationView(
                                                operation.type,
                                            );

                                        return (
                                            <div
                                                className="operation-row"
                                                key={
                                                    operation.operationId
                                                }
                                            >
                                                <span className="operation-time">
                                                    {formatOperationTime(
                                                        operation.createdAtUtc,
                                                    )}
                                                </span>

                                                <span
                                                    className={`operation-type operation-${operationView.tone}`}
                                                >
                                                    {
                                                        operationView.label
                                                    }
                                                </span>

                                                <div className="operation-material">
                                                    <strong>
                                                        {
                                                            operation.materialName
                                                        }
                                                    </strong>

                                                    <span>
                                                        {formatQuantityChange(
                                                            operation.quantityChange,
                                                            operation.unit,
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="operation-user">
                                                    {
                                                        operation.userFullName
                                                    }

                                                    <span>
                                                        {
                                                            operation.userLogin
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    },
                                )}
                        </div>
                    </section>
                </div>

                <aside className="dashboard-side-column">
                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>
                                    Быстрые действия
                                </h2>

                                <p>
                                    Основные операции склада
                                </p>
                            </div>
                        </div>

                        <div className="quick-actions">
                            <QuickAction
                                icon={
                                    <ArrowDownToLine />
                                }
                                title="Приход"
                                subtitle="Создать приход"
                                tone="success"
                                onClick={() => navigate('/receiving')}
                            />

                            <QuickAction
                                icon={
                                    <ArrowUpFromLine />
                                }
                                title="Расход"
                                subtitle="Создать расход"
                                tone="danger"
                                onClick={() => navigate('/issue')}
                            />

                            <QuickAction
                                icon={
                                    <ClipboardCheck />
                                }
                                title="Инвентаризация"
                                subtitle="Новый документ"
                                tone="info"
                                onClick={() => navigate('/inventory')}
                            />

                            <QuickAction
                                icon={<Plus />}
                                title="Материал"
                                subtitle="Добавить материал"
                                tone="blue"
                                onClick={() => navigate('/materials')}
                            />
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>
                                    Состояние склада
                                </h2>

                                <p>Общая сводка</p>
                            </div>
                        </div>

                        <div className="warehouse-health">
                            <div className="health-circle">
                                <strong>
                                    {loading
                                        ? '—'
                                        : `${healthPercent}%`}
                                </strong>

                                <span>в наличии</span>
                            </div>

                            <div className="health-list">
                                <div>
                                    <span>
                                        В наличии
                                    </span>

                                    <strong>
                                        {displayNumber(
                                            dashboard?.materialsWithStock,
                                        )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Низкий остаток
                                    </span>

                                    <strong>
                                        {loading
                                            ? '—'
                                            : numberFormatter.format(
                                                lowStockOnly,
                                            )}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Отсутствуют
                                    </span>

                                    <strong>
                                        {displayNumber(
                                            dashboard?.materialsWithoutStock,
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="panel">
                        <div className="panel-header">
                            <div>
                                <h2>
                                    Дополнительная статистика
                                </h2>

                                <p>
                                    Данные из складской системы
                                </p>
                            </div>
                        </div>

                        <div className="health-list">
                            <div>
                                <span>
                                    Категорий
                                </span>

                                <strong>
                                    {displayNumber(
                                        dashboard?.totalCategories,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Общий остаток
                                </span>

                                <strong>
                                    {displayNumber(
                                        dashboard?.totalQuantity,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Приходов сегодня
                                </span>

                                <strong>
                                    {displayNumber(
                                        dashboard?.receivingToday,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Расходов сегодня
                                </span>

                                <strong>
                                    {displayNumber(
                                        dashboard?.issueToday,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Инвентаризаций
                                </span>

                                <strong>
                                    {displayNumber(
                                        dashboard?.inventoryOperations,
                                    )}
                                </strong>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

function MaterialStatus({
    status,
}: {
    status: string;
}) {
    if (status === 'OutOfStock') {
        return (
            <span className="status status-danger">
                <span className="status-dot" />
                Нет в наличии
            </span>
        );
    }

    return (
        <span className="status status-warning">
            <span className="status-dot" />
            Низкий остаток
        </span>
    );
}

function formatQuantity(
    quantity: number,
    unit: string,
) {
    return `${numberFormatter.format(quantity)} ${getUnitLabel(
        unit,
    )}`;
}

function formatQuantityChange(
    quantity: number,
    unit: string,
) {
    const formatted =
        numberFormatter.format(
            Math.abs(quantity),
        );

    const sign =
        quantity > 0
            ? '+'
            : quantity < 0
                ? '−'
                : '';

    return `${sign}${formatted} ${getUnitLabel(unit)}`;
}

function getUnitLabel(unit: string) {
    switch (unit) {
        case 'pcs':
            return 'шт.';

        case 'm':
            return 'м';

        case 'm2':
            return 'м²';

        case 'kg':
            return 'кг';

        case 'l':
            return 'л';

        case 'roll':
            return 'рул.';

        case 'sheet':
            return 'лист.';

        default:
            return unit;
    }
}

function getOperationView(type: string) {
    switch (type) {
        case 'Receiving':
            return {
                label: 'Приход',
                tone: 'success',
            };

        case 'Issue':
            return {
                label: 'Расход',
                tone: 'danger',
            };

        case 'Inventory':
            return {
                label: 'Инвентаризация',
                tone: 'info',
            };

        case 'Return':
            return {
                label: 'Возврат',
                tone: 'success',
            };

        case 'WriteOff':
            return {
                label: 'Списание',
                tone: 'danger',
            };

        default:
            return {
                label: type,
                tone: 'info',
            };
    }
}

function formatOperationTime(
    createdAtUtc: string,
) {
    return new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(createdAtUtc));
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
    onClick,
}: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    tone: string;
    onClick: () => void;
}) {
    return (
        <button
            className={`quick-action quick-${tone}`}
            type="button"
            onClick={onClick}
        >
            {icon}

            <strong>
                {title}
            </strong>

            <span>
                {subtitle}
            </span>
        </button>
    );
}

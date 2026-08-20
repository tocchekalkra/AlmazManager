import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, BarChart3, Boxes, CalendarClock, Droplets, FileText, PackageCheck } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api';
import { useAuth } from '../auth/AuthContext';
import { filmMarkerText } from '../utils/material';

type AttentionMaterial = { materialId: string; name: string; article: string; category: string; quantity: number; minimumQuantity: number; unit: string; status: string };
type RecentDocument = { documentId: string; number: string; type: string; createdAtUtc: string; postedAtUtc?: string | null; userFullName: string; recipient?: string | null; itemCount: number; summary: string };
type ConsumptionDay = { date: string; documentCount: number; itemCount: number; topMaterial?: string | null };
type InkMachine = { machineName: string; totalLiters: number; colors: { colorName: string; colorHex: string; quantityLiters: number; minimumLiters: number; belowMinimum: boolean }[] };
type DashboardResponse = {
    totalMaterials: number; activeMaterials: number; belowMinimumCount: number;
    receivingToday: number; issueToday: number; issueYesterday: number;
    attentionMaterials: AttentionMaterial[]; recentDocuments: RecentDocument[]; consumptionDays: ConsumptionDay[]; inkByMachine: InkMachine[];
};

const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 });

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        api.get<DashboardResponse>('/dashboard')
            .then((response) => { if (!cancelled) setDashboard(response.data); })
            .catch((requestError) => { if (!cancelled) setError(requestError?.response?.data?.message ?? 'Не удалось загрузить обзор склада.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const maxActivity = Math.max(1, ...(dashboard?.consumptionDays?.map((day) => day.itemCount) ?? [1]));
    const currentDate = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    return (
        <div className="page">
            <div className="page-heading"><div><p className="eyebrow">ALMAZMANAGER</p><h1>Добрый день, {user?.name ?? 'сотрудник'}</h1><p>Главное по складу на текущий момент.</p></div><div className="date-card"><strong>{currentDate}</strong><span>{error ? 'Нет связи со складом' : 'Данные актуальны'}</span></div></div>
            {error && <div className="form-message error">{error}</div>}

            <section className="stats-grid dashboard-stats-five">
                <Stat icon={<Boxes />} value={loading ? '—' : String(dashboard?.activeMaterials ?? 0)} label="Материалов" hint="Активные позиции" tone="blue" onClick={() => navigate('/stock')} />
                <Stat icon={<AlertTriangle />} value={loading ? '—' : String(dashboard?.belowMinimumCount ?? 0)} label="Ниже минимума" hint="Требуют внимания" tone="amber" onClick={() => navigate('/stock?belowMinimum=true')} />
                <Stat icon={<ArrowDownToLine />} value={loading ? '—' : String(dashboard?.receivingToday ?? 0)} label="Приход сегодня" hint="Проведённые позиции" tone="green" onClick={() => navigate('/documents?type=Receiving')} />
                <Stat icon={<ArrowUpFromLine />} value={loading ? '—' : String(dashboard?.issueToday ?? 0)} label="Расход сегодня" hint="Проведённые позиции" tone="red" onClick={() => navigate('/documents?type=Issue')} />
                <Stat icon={<CalendarClock />} value={loading ? '—' : String(dashboard?.issueYesterday ?? 0)} label="Выдано вчера" hint="Проведённые позиции" tone="blue" onClick={() => navigate('/consumption')} />
            </section>

            <section className="panel dashboard-consumption-card" onClick={() => navigate('/consumption')}>
                <div className="panel-header"><div><h2><BarChart3 size={17} /> Расход материалов по дням</h2><p>Последние 7 дней · нажмите для подробностей</p></div><button className="text-button" type="button">Открыть статистику</button></div>
                <div className="mini-consumption-chart">
                    {(dashboard?.consumptionDays ?? []).map((day) => <div key={day.date} title={`${day.documentCount} документов · ${day.itemCount} позиций${day.topMaterial ? ` · чаще: ${day.topMaterial}` : ''}`}><span style={{ height: `${Math.max(5, day.itemCount / maxActivity * 100)}%` }}><i>{day.itemCount}</i></span><small>{new Date(`${day.date}T00:00:00`).toLocaleDateString('ru-RU', { weekday: 'short', day: '2-digit' })}</small></div>)}
                </div>
            </section>

            {(dashboard?.inkByMachine?.length ?? 0) > 0 && (
                <section className="panel">
                    <div className="panel-header"><div><h2><Droplets size={17} /> Остатки краски</h2><p>Отдельно по каждому станку · литры</p></div><button className="text-button" type="button" onClick={() => navigate('/stock')}>Открыть склад</button></div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                        {(dashboard?.inkByMachine ?? []).map((machine) => (
                            <article key={machine.machineName} style={{ border: '1px solid var(--border)', borderRadius: 14, padding: 14, background: 'var(--surface-soft)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}><strong>{machine.machineName}</strong><strong>{number.format(machine.totalLiters)} л</strong></div>
                                <div style={{ display: 'grid', gap: 7 }}>
                                    {machine.colors.map((color) => (
                                        <div key={color.colorName} style={{ display: 'grid', gridTemplateColumns: '18px 1fr auto', alignItems: 'center', gap: 8 }}>
                                            <span style={{ width: 16, height: 16, borderRadius: 5, background: color.colorHex, border: '1px solid rgba(127,127,127,.35)' }} />
                                            <span>{color.colorName}</span>
                                            <strong style={{ color: color.belowMinimum ? 'var(--danger)' : undefined }}>{number.format(color.quantityLiters)} л</strong>
                                        </div>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </section>
            )}

            <div className="dashboard-two-columns">
                <section className="panel"><div className="panel-header"><div><h2>Требуют внимания</h2><p>Три наиболее критичные позиции</p></div><button className="text-button" type="button" onClick={() => navigate('/stock?belowMinimum=true')}>Показать все</button></div><div className="table-wrapper"><table className="data-table"><thead><tr><th>Материал</th><th>Остаток</th><th>Минимум</th><th>Статус</th></tr></thead><tbody>{(dashboard?.attentionMaterials ?? []).slice(0, 3).map((item) => <tr key={item.materialId} onClick={() => navigate(`/stock?material=${item.materialId}`)} className="clickable-row"><td className="primary-cell">{item.name}{filmMarkerText(item.category) ? ` · ${filmMarkerText(item.category)}` : ''}<small className="table-subtitle">{item.article} · {item.category}</small></td><td>{number.format(item.quantity)} {unitLabel(item.unit)}</td><td>{number.format(item.minimumQuantity)} {unitLabel(item.unit)}</td><td><span className={item.quantity <= 0 ? 'status status-danger' : 'status status-warning'}><i className="status-dot" />{item.quantity <= 0 ? 'Нет в наличии' : 'Низкий остаток'}</span></td></tr>)}</tbody></table></div>{!loading && (dashboard?.attentionMaterials.length ?? 0) === 0 && <div className="empty-state"><PackageCheck size={24} />Все остатки в норме</div>}</section>

                <section className="panel"><div className="panel-header"><div><h2>Последние документы</h2><p>Три последние складские операции</p></div><button className="text-button" type="button" onClick={() => navigate('/documents')}>Открыть журнал</button></div><div className="recent-document-list">{(dashboard?.recentDocuments ?? []).slice(0, 3).map((item) => <button key={item.documentId} type="button" onClick={() => navigate(`/documents?document=${item.documentId}`)}><span className={item.type === 'Receiving' ? 'document-icon receiving' : 'document-icon issue'}>{item.type === 'Receiving' ? <ArrowDownToLine size={17} /> : <ArrowUpFromLine size={17} />}</span><span><strong>{item.number} · {item.type === 'Receiving' ? 'Приход' : 'Расход'}</strong><small>{item.summary || 'Состав не указан'} · {item.recipient || item.userFullName}</small></span><time>{new Date(item.postedAtUtc ?? item.createdAtUtc).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</time></button>)}</div>{!loading && (dashboard?.recentDocuments.length ?? 0) === 0 && <div className="empty-state"><FileText size={24} />Операций пока нет</div>}</section>
            </div>
        </div>
    );
}

function Stat({ icon, value, label, hint, tone, onClick }: { icon: ReactNode; value: string; label: string; hint: string; tone: string; onClick: () => void }) { return <button type="button" className={`stat-card stat-${tone} clickable-stat`} onClick={onClick}><span className="stat-icon">{icon}</span><span><strong className="stat-value">{value}</strong><span className="stat-label">{label}</span><small>{hint}</small></span></button>; }
function unitLabel(unit: string) { return ({ pcs: 'шт.', m: 'м', m2: 'м²', kg: 'кг', l: 'л', roll: 'рул.', sheet: 'лист' } as Record<string, string>)[unit] ?? unit; }

import { ArrowLeft, CalendarDays, FileText, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api';
import { loadAllMaterialCatalogItems } from '../api/catalog';
import { materialDisplayName } from '../utils/material';

type Material = {
    id: string;
    name: string;
    article: string;
    categoryId: string;
    categoryName: string;
    kind: string;
    widthMeters?: number | null;
    colorCode?: string | null;
    colorName?: string | null;
};
type Category = { id: string; name: string; isActive: boolean };
type ConsumptionItem = {
    documentId: string;
    documentNumber: string;
    postedAtUtc?: string | null;
    materialId: string;
    materialName: string;
    quantity: number;
    unit: string;
    recipient?: string | null;
    userFullName: string;
};
type ConsumptionDay = { date: string; documentCount: number; itemCount: number; items: ConsumptionItem[] };
type Response = { from: string; to: string; days: ConsumptionDay[] };

const formatter = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 3 });

export default function ConsumptionPage() {
    const navigate = useNavigate();
    const today = toInputDate(new Date());
    const weekAgo = toInputDate(new Date(Date.now() - 6 * 86_400_000));
    const [from, setFrom] = useState(weekAgo);
    const [to, setTo] = useState(today);
    const [materialId, setMaterialId] = useState('');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [data, setData] = useState<Response | null>(null);
    const [selectedDate, setSelectedDate] = useState(today);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        void Promise.all([
            loadAllMaterialCatalogItems<Material>(),
            api.get<Category[]>('/categories'),
        ]).then(([materialItems, categoryResponse]) => {
            setMaterials(materialItems);
            setCategories(categoryResponse.data.filter((category) => category.isActive));
        });
    }, []);

    useEffect(() => { void load(); }, [from, to, materialId]);

    async function load() {
        try {
            setLoading(true);
            setError('');
            const response = await api.get<Response>('/dashboard/consumption', {
                params: { from, to, materialId: materialId || undefined },
            });
            setData(response.data);
            if (!response.data.days.some((day) => day.date === selectedDate)) {
                setSelectedDate(response.data.days.at(-1)?.date ?? to);
            }
        } catch (requestError: any) {
            setError(requestError?.response?.data?.message ?? 'Не удалось загрузить статистику расхода.');
        } finally {
            setLoading(false);
        }
    }

    const maxActivity = Math.max(1, ...(data?.days.map((day) => day.itemCount) ?? [1]));
    const selected = data?.days.find((day) => day.date === selectedDate);
    const grouped = useMemo(() => {
        const result = new Map<string, { name: string; unit: string; quantity: number; rows: ConsumptionItem[] }>();
        for (const item of selected?.items ?? []) {
            const current = result.get(item.materialId) ?? { name: item.materialName, unit: item.unit, quantity: 0, rows: [] };
            current.quantity += item.quantity;
            current.rows.push(item);
            result.set(item.materialId, current);
        }
        return [...result.values()];
    }, [selected]);

    return (
        <div className="page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">CONSUMPTION</p>
                    <h1>Расход материалов по дням</h1>
                    <p>Выберите день на графике, чтобы увидеть материалы и документы.</p>
                </div>
                <button className="button secondary" type="button" onClick={() => navigate('/')}><ArrowLeft size={16} />На обзор</button>
            </div>

            <section className="panel filter-toolbar">
                <label><span>С</span><input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label>
                <label><span>По</span><input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label>
                <label className="filter-grow">
                    <span>Материал</span>
                    <div className="input-with-icon">
                        <Search size={16} />
                        <select value={materialId} onChange={(event) => setMaterialId(event.target.value)}>
                            <option value="">Все материалы</option>
                            {categories.map((category) => {
                                const categoryMaterials = materials.filter((material) => material.categoryId === category.id);
                                return categoryMaterials.length > 0 ? (
                                    <optgroup key={category.id} label={category.name}>
                                        {categoryMaterials.map((material) => (
                                            <option key={material.id} value={material.id}>
                                                {materialDisplayName(material)} · {material.article}
                                            </option>
                                        ))}
                                    </optgroup>
                                ) : null;
                            })}
                        </select>
                    </div>
                </label>
            </section>

            {error && <div className="form-message error">{error}</div>}

            <section className="panel consumption-chart-panel">
                <div className="panel-header"><div><h2>Активность расхода</h2><p>Высота столбца — количество выданных позиций, без сложения разных единиц измерения.</p></div></div>
                <div className="consumption-chart">
                    {(data?.days ?? []).map((day) => (
                        <button key={day.date} type="button" className={day.date === selectedDate ? 'selected' : ''} onClick={() => setSelectedDate(day.date)} title={`${day.documentCount} документов, ${day.itemCount} позиций`}>
                            <span className="consumption-bar" style={{ height: `${Math.max(5, day.itemCount / maxActivity * 100)}%` }}><i>{day.itemCount}</i></span>
                            <small>{new Date(`${day.date}T00:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</small>
                        </button>
                    ))}
                    {loading && <div className="empty-state">Загрузка статистики...</div>}
                </div>
            </section>

            <section className="panel" style={{ marginTop: 15 }}>
                <div className="panel-header"><div><h2><CalendarDays size={17} /> {selected ? formatDate(selected.date) : 'Выберите день'}</h2><p>{selected?.documentCount ?? 0} документов · {selected?.itemCount ?? 0} позиций</p></div></div>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead><tr><th>Материал</th><th>Всего за день</th><th>Документы и получатели</th></tr></thead>
                        <tbody>
                            {grouped.map((group) => <tr key={`${group.name}-${group.unit}`}><td className="primary-cell">{group.name}</td><td>{formatter.format(group.quantity)} {unitLabel(group.unit)}</td><td>{group.rows.map((row) => <button key={`${row.documentId}-${row.materialId}`} type="button" className="document-chip" onClick={() => navigate(`/documents?document=${row.documentId}`)}><FileText size={13} />{row.documentNumber} · {row.recipient || 'получатель не указан'} · {row.userFullName}</button>)}</td></tr>)}
                        </tbody>
                    </table>
                </div>
                {!loading && grouped.length === 0 && <div className="empty-state">В этот день расхода не было.</div>}
            </section>
        </div>
    );
}

function toInputDate(date: Date) { return date.toISOString().slice(0, 10); }
function formatDate(date: string) { return new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); }
function unitLabel(unit: string) { return ({ Piece: 'шт.', Meter: 'м', SquareMeter: 'м²', Kilogram: 'кг', Liter: 'л', Roll: 'рул.', Sheet: 'лист' } as Record<string, string>)[unit] ?? unit; }

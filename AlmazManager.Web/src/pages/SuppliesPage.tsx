import {
  ArrowDownToLine,
  FileUp,
  Plus,
  RefreshCcw,
  Save,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import api from "../api/api";
import { loadAllMaterialCatalogItems } from "../api/catalog";
import { materialDisplayName } from "../utils/material";

type Material = {
  id: string;
  name: string;
  article: string;
  categoryId: string;
  categoryName: string;
  unit: string;
  isActive: boolean;
  kind: string;
  widthMeters?: number | null;
  colorCode?: string | null;
  colorName?: string | null;
  machineName?: string | null;
  packageLiters?: number | null;
};
type Category = { id: string; name: string; isActive: boolean };
type SupplyItem = {
  id: string;
  materialId: string;
  expectedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
};
type Supply = {
  id: string;
  supplier: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  paymentDueDate?: string | null;
  expectedDeliveryDate?: string | null;
  attachmentUrl?: string | null;
  comment?: string | null;
  status: string;
  createdAtUtc: string;
  updatedAtUtc: string;
  items: SupplyItem[];
};
type DraftLine = { materialId: string; expectedQuantity: number };

const emptyDate = new Date().toISOString().slice(0, 10);
const money = new Intl.NumberFormat("ru-RU", {
  style: "currency",
  currency: "RUB",
});

export default function SuppliesPage() {
  const [searchParams] = useSearchParams();
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    searchParams.get("invoice"),
  );
  const [formOpen, setFormOpen] = useState(false);
  const [supplier, setSupplier] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(emptyDate);
  const [amount, setAmount] = useState(0);
  const [paymentDueDate, setPaymentDueDate] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [comment, setComment] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [materialId, setMaterialId] = useState("");
  const [pickerCategoryId, setPickerCategoryId] = useState("");
  const [pickerGroupKey, setPickerGroupKey] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const materialById = useMemo(
    () => new Map(materials.map((item) => [item.id, item])),
    [materials],
  );
  const pickerCategories = useMemo(() => categories
    .filter((category) => category.isActive && materials.some((material) => material.categoryId === category.id)),
    [categories, materials]);
  const pickerMaterials = useMemo(() => materials.filter((material) => material.categoryId === pickerCategoryId), [materials, pickerCategoryId]);
  const pickerGroups = useMemo(() => {
    const groups = new Map<string, { key: string; label: string; materials: Material[]; ink: boolean }>();
    for (const material of pickerMaterials) {
      const ink = material.kind === "Ink";
      const label = ink ? (material.machineName?.trim() || "Без станка") : baseMaterialName(material.name);
      const key = `${ink ? "machine" : "material"}:${label.toLowerCase()}`;
      const group = groups.get(key) ?? { key, label, materials: [], ink };
      group.materials.push(material);
      groups.set(key, group);
    }
    return [...groups.values()].map((group) => ({
      ...group,
      materials: group.materials.sort((a, b) => group.ink
        ? inkColorOrder(a.colorName) - inkColorOrder(b.colorName) || Number(a.packageLiters ?? 0) - Number(b.packageLiters ?? 0)
        : Number(b.widthMeters ?? 0) - Number(a.widthMeters ?? 0)),
    }));
  }, [pickerMaterials]);
  const selectedPickerGroup = pickerGroups.find((group) => group.key === pickerGroupKey);
  const selected = supplies.find((item) => item.id === selectedId) ?? null;

  useEffect(() => {
    void load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const [supplyResponse, materialItems, categoryResponse] = await Promise.all([
        api.get<Supply[]>("/supplies"),
        loadAllMaterialCatalogItems<Material>(),
        api.get<Category[]>("/categories"),
      ]);
      setSupplies(supplyResponse.data ?? []);
      setMaterials(
        materialItems.filter(
          (item) => item.isActive && item.kind !== "Oracal641",
        ),
      );
      setCategories(categoryResponse.data ?? []);
      if (!selectedId && supplyResponse.data.length > 0)
        setSelectedId(supplyResponse.data[0].id);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ??
          "Не удалось загрузить счета и поставки.",
      );
    } finally {
      setLoading(false);
    }
  }

  function addLine() {
    if (!materialId || quantity <= 0) return;
    const material = materialById.get(materialId);
    const normalizedQuantity = material?.kind === "Ink"
      ? Math.max(0.1, Math.round(quantity * 10) / 10)
      : Math.max(1, Math.round(quantity));
    setLines((current) =>
      current.some((line) => line.materialId === materialId)
        ? current.map((line) =>
            line.materialId === materialId
              ? { ...line, expectedQuantity: normalizedQuantity }
              : line,
          )
        : [...current, { materialId, expectedQuantity: normalizedQuantity }],
    );
    setMaterialId("");
    setPickerGroupKey("");
    setQuantity(1);
  }

  async function createInvoice() {
    if (!supplier.trim() || !invoiceNumber.trim() || lines.length === 0) {
      setError("Укажите поставщика, номер счёта и хотя бы один материал.");
      return;
    }

    try {
      setWorking(true);
      setError("");
      setSuccess("");
      const response = await api.post<Supply>("/supplies", {
        supplier: supplier.trim(),
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        amount,
        paymentDueDate: paymentDueDate || null,
        expectedDeliveryDate: expectedDeliveryDate || null,
        comment: comment.trim() || null,
        items: lines,
      });
      setSuccess(`Счёт ${response.data.invoiceNumber} зарегистрирован.`);
      setFormOpen(false);
      resetForm();
      await load();
      setSelectedId(response.data.id);
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ??
          "Не удалось зарегистрировать счёт.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function changeStatus(status: string) {
    if (!selected) return;
    try {
      setWorking(true);
      setError("");
      await api.patch(`/supplies/${selected.id}/status`, { status });
      await load();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ?? "Не удалось изменить статус.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function upload(file?: File) {
    if (!selected || !file) return;
    const body = new FormData();
    body.append("file", file);
    try {
      setWorking(true);
      setError("");
      await api.post(`/supplies/${selected.id}/attachment`, body);
      await load();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ??
          "Не удалось загрузить файл счёта.",
      );
    } finally {
      setWorking(false);
    }
  }

  async function createReceiving() {
    if (!selected) return;
    const remaining = selected.items.filter(
      (item) => item.remainingQuantity > 0,
    );
    if (remaining.length === 0) return;
    if (
      !window.confirm(
        `Создать и провести приход по счёту ${selected.invoiceNumber}?`,
      )
    )
      return;

    try {
      setWorking(true);
      setError("");
      const created = await api.post<{ id: string }>("/documents", {
        type: "Receiving",
        documentDate: emptyDate,
        supplyInvoiceId: selected.id,
        supplier: selected.supplier,
        externalNumber: selected.invoiceNumber,
        recipient: null,
        comment: `Приход по счёту ${selected.invoiceNumber}`,
        items: remaining.map((item) => ({
          materialId: item.materialId,
          quantity: item.remainingQuantity,
        })),
      });
      await api.post(`/documents/${created.data.id}/post`);
      setSuccess("Поставка принята, остатки и ожидаемое количество обновлены.");
      await load();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ??
          "Не удалось провести приход по счёту.",
      );
    } finally {
      setWorking(false);
    }
  }

  function resetForm() {
    setSupplier("");
    setInvoiceNumber("");
    setInvoiceDate(emptyDate);
    setAmount(0);
    setPaymentDueDate("");
    setExpectedDeliveryDate("");
    setComment("");
    setLines([]);
    setPickerCategoryId("");
    setPickerGroupKey("");
    setMaterialId("");
  }

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">SUPPLY CONTROL</p>
          <h1>Счета и будущие поставки</h1>
          <p>Оплата, ожидаемые материалы и приёмка в одном месте.</p>
        </div>
        <div className="heading-actions">
          <button
            className="button secondary"
            type="button"
            onClick={() => void load()}
          >
            <RefreshCcw size={16} />
            Обновить
          </button>
          <button
            className="button primary"
            type="button"
            onClick={() => setFormOpen(true)}
          >
            <Plus size={16} />
            Добавить счёт
          </button>
        </div>
      </div>
      {error && <div className="form-message error">{error}</div>}
      {success && <div className="form-message success">{success}</div>}

      <div className="supply-layout">
        <section className="panel supply-list">
          <div className="panel-header">
            <div>
              <h2>Счета</h2>
              <p>{supplies.length} зарегистрировано</p>
            </div>
          </div>
          {loading && <div className="empty-state">Загрузка...</div>}
          {supplies.map((invoice) => (
            <button
              key={invoice.id}
              type="button"
              className={
                invoice.id === selectedId ? "supply-row selected" : "supply-row"
              }
              onClick={() => setSelectedId(invoice.id)}
            >
              <span>
                <strong>{invoice.supplier}</strong>
                <small>
                  № {invoice.invoiceNumber} от {formatDate(invoice.invoiceDate)}
                </small>
              </span>
              <span>
                <b>{money.format(invoice.amount)}</b>
                <i className={`supply-status ${invoice.status}`}>
                  {statusLabel(invoice.status)}
                </i>
              </span>
            </button>
          ))}
          {!loading && supplies.length === 0 && (
            <div className="empty-state">Счета ещё не добавлены.</div>
          )}
        </section>

        <section className="panel supply-details">
          {selected ? (
            <>
              <div className="panel-header">
                <div>
                  <h2>
                    {selected.supplier} · № {selected.invoiceNumber}
                  </h2>
                  <p>Счёт от {formatDate(selected.invoiceDate)}</p>
                </div>
                <select
                  value={selected.status}
                  disabled={working}
                  onChange={(event) => void changeStatus(event.target.value)}
                >
                  <option value="AwaitingPayment">Ожидает оплаты</option>
                  <option value="Paid">Оплачен</option>
                  <option value="AwaitingDelivery">Ожидается поставка</option>
                  <option value="PartiallyReceived">Получен частично</option>
                  <option value="FullyReceived">Получен полностью</option>
                  <option value="Cancelled">Отменён</option>
                </select>
              </div>
              <div className="supply-meta">
                <div>
                  <span>Сумма</span>
                  <strong>{money.format(selected.amount)}</strong>
                </div>
                <div>
                  <span>Оплатить до</span>
                  <strong>
                    {selected.paymentDueDate
                      ? formatDate(selected.paymentDueDate)
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Ожидаемая поставка</span>
                  <strong>
                    {selected.expectedDeliveryDate
                      ? formatDate(selected.expectedDeliveryDate)
                      : "—"}
                  </strong>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Материал</th>
                      <th>Ожидается</th>
                      <th>Получено</th>
                      <th>Осталось</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item) => {
                      const material = materialById.get(item.materialId);
                      return (
                        <tr key={item.id}>
                          <td className="primary-cell">
                            {material ? <MaterialLabel material={material} /> : "Материал из архива"}
                            <small className="table-subtitle">
                              {material?.article}
                            </small>
                          </td>
                          <td>
                            {formatQuantity(item.expectedQuantity)}{" "}
                            {unitLabel(material?.unit)}
                          </td>
                          <td>
                            {formatQuantity(item.receivedQuantity)}{" "}
                            {unitLabel(material?.unit)}
                          </td>
                          <td
                            className={
                              item.remainingQuantity > 0
                                ? "expected-quantity"
                                : ""
                            }
                          >
                            {formatQuantity(item.remainingQuantity)}{" "}
                            {unitLabel(material?.unit)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="supply-actions">
                <label className="button secondary">
                  <FileUp size={16} />
                  {selected.attachmentUrl ? "Заменить файл" : "Прикрепить счёт"}
                  <input
                    type="file"
                    hidden
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(event) => void upload(event.target.files?.[0])}
                  />
                </label>
                {selected.attachmentUrl && (
                  <a
                    className="button secondary"
                    href={attachmentHref(selected.attachmentUrl)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Открыть файл
                  </a>
                )}
                <button
                  className="button primary"
                  type="button"
                  disabled={
                    working ||
                    selected.items.every((item) => item.remainingQuantity <= 0)
                  }
                  onClick={() => void createReceiving()}
                >
                  <ArrowDownToLine size={16} />
                  Создать приход
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <Truck size={28} />
              Выберите счёт слева.
            </div>
          )}
        </section>
      </div>

      {formOpen && (
        <div className="modal-overlay" onMouseDown={() => setFormOpen(false)}>
          <div
            className="modal-card supply-form"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="modal-title">
              <div>
                <p className="eyebrow">NEW INVOICE</p>
                <h2>Новый счёт</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="form-grid">
              <label>
                <span>Поставщик</span>
                <input
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                />
              </label>
              <label>
                <span>Номер счёта</span>
                <input
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                />
              </label>
              <label>
                <span>Дата счёта</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                />
              </label>
              <label>
                <span>Сумма</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </label>
              <label>
                <span>Оплатить до</span>
                <input
                  type="date"
                  value={paymentDueDate}
                  onChange={(event) => setPaymentDueDate(event.target.value)}
                />
              </label>
              <label>
                <span>Ожидаемая поставка</span>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(event) =>
                    setExpectedDeliveryDate(event.target.value)
                  }
                />
              </label>
            </div>
            <div className="supply-line-builder">
              <select
                value={pickerCategoryId}
                onChange={(event) => {
                  setPickerCategoryId(event.target.value);
                  setPickerGroupKey("");
                  setMaterialId("");
                }}
              >
                <option value="">Категория</option>
                {pickerCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <select
                value={pickerGroupKey}
                disabled={!pickerCategoryId}
                onChange={(event) => {
                  setPickerGroupKey(event.target.value);
                  setMaterialId("");
                }}
              >
                <option value="">{pickerGroups[0]?.ink ? "Станок" : "Материал"}</option>
                {pickerGroups.map((group) => <option key={group.key} value={group.key}>{group.label}</option>)}
              </select>
              <select
                value={materialId}
                disabled={!pickerGroupKey}
                onChange={(event) => setMaterialId(event.target.value)}
              >
                <option value="">{selectedPickerGroup?.ink ? "Цвет" : "Ширина"}</option>
                {selectedPickerGroup?.materials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {selectedPickerGroup?.ink
                      ? `${material.colorName ?? "Без цвета"} · ${material.packageLiters ?? "—"} л`
                      : `${material.widthMeters ? `${formatQuantity(material.widthMeters)} м` : "Без ширины"} · ${material.article}`}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={materialById.get(materialId)?.kind === "Ink" ? "0.1" : "1"}
                step={materialById.get(materialId)?.kind === "Ink" ? "0.1" : "1"}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
              />
              <button
                className="button secondary"
                type="button"
                onClick={addLine}
              >
                <Plus size={15} />
                Добавить
              </button>
            </div>
            <div className="draft-lines">
              {lines.map((line) => (
                <div key={line.materialId}>
                  <span>
                    {materialById.get(line.materialId)
                      ? <MaterialLabel material={materialById.get(line.materialId)!} />
                      : "Материал из архива"}
                  </span>
                  <strong>
                    {formatQuantity(line.expectedQuantity)}{" "}
                    {unitLabel(materialById.get(line.materialId)?.unit)}
                  </strong>
                  <button
                    type="button"
                    onClick={() =>
                      setLines((items) =>
                        items.filter(
                          (item) => item.materialId !== line.materialId,
                        ),
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <label className="full-field">
              <span>Комментарий</span>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
            </label>
            <div className="modal-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setFormOpen(false)}
              >
                Отмена
              </button>
              <button
                className="button primary"
                type="button"
                disabled={working}
                onClick={() => void createInvoice()}
              >
                <Save size={16} />
                {working ? "Сохранение..." : "Сохранить счёт"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("ru-RU");
}
function MaterialLabel({ material }: { material: Material }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {material.colorHex && <i style={{ width: 16, height: 16, borderRadius: 5, flex: "0 0 auto", background: material.colorHex, border: "1px solid rgba(127,127,127,.35)" }} />}
      <span>{materialDisplayName(material)}</span>
    </span>
  );
}
function formatQuantity(value: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 }).format(
    value,
  );
}
function attachmentHref(path: string) {
  return new URL(
    path,
    new URL(api.defaults.baseURL ?? "/api", window.location.origin),
  ).toString();
}
function unitLabel(unit?: string) {
  return (
    (
      {
        Piece: "шт.",
        Meter: "м",
        SquareMeter: "м²",
        Kilogram: "кг",
        Liter: "л",
        Roll: "рул.",
        Sheet: "лист",
      } as Record<string, string>
    )[unit ?? ""] ?? ""
  );
}
function statusLabel(status: string) {
  return (
    (
      {
        AwaitingPayment: "Ожидает оплаты",
        Paid: "Оплачен",
        AwaitingDelivery: "Ожидается поставка",
        PartiallyReceived: "Получен частично",
        FullyReceived: "Получен полностью",
        Cancelled: "Отменён",
      } as Record<string, string>
    )[status] ?? status
  );
}

function baseMaterialName(value: string) {
  return value.replace(/\s+-?\s*\d+(?:[.,]\d+)?\s*м\s*$/i, "").trim();
}
function inkColorOrder(value?: string | null) {
  const order = ["Cyan", "Magenta", "Yellow", "Black", "White"];
  const index = order.indexOf(value ?? "");
  return index < 0 ? 99 : index;
}

import { materialDisplayName } from './material';

export type ExportStockItem = {
    materialId: string;
    materialName: string;
    article: string;
    categoryName: string;
    unit: string;
    kind: string;
    widthMeters?: number | null;
    colorCode?: string | null;
    colorName?: string | null;
    colorHex?: string | null;
    currentQuantity: number;
    expectedQuantity: number;
    minimumQuantity: number;
    belowMinimum: boolean;
};

const numberFormatter = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 3,
});

export function exportStockExcel(
    items: ExportStockItem[],
    kind: 'standard' | 'oracal',
) {
    const selected = filterKind(items, kind);
    const headers = kind === 'oracal'
        ? ['Код', 'Цвет', 'Ширина', 'Остаток', 'В пути', 'Минимум', 'Ед.', 'Статус']
        : ['Категория', 'Материал', 'Артикул', 'Ширина', 'Остаток', 'В пути', 'Минимум', 'Ед.', 'Статус'];

    const rows = selected.map((item) => kind === 'oracal'
        ? [
            item.colorCode ?? '',
            item.colorName ?? item.materialName,
            item.widthMeters ?? '',
            item.currentQuantity,
            item.expectedQuantity,
            item.minimumQuantity,
            unitLabel(item.unit),
            statusLabel(item),
        ]
        : [
            item.categoryName,
            materialDisplayName(item),
            item.article,
            item.widthMeters ?? '',
            item.currentQuantity,
            item.expectedQuantity,
            item.minimumQuantity,
            unitLabel(item.unit),
            statusLabel(item),
        ]);

    const title = kind === 'oracal'
        ? 'Актуальный склад ORACAL 641'
        : 'Актуальный склад обычных материалов';
    const xmlRows = [headers, ...rows]
        .map((row, rowIndex) => `<Row>${row.map((value) => {
            const numeric = typeof value === 'number';
            const style = rowIndex === 0 ? 'Header' : numeric ? 'Number' : 'Text';
            const type = numeric ? 'Number' : 'String';
            return `<Cell ss:StyleID="${style}"><Data ss:Type="${type}">${escapeXml(String(value))}</Data></Cell>`;
        }).join('')}</Row>`)
        .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Text"><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E0E8"/></Borders></Style>
  <Style ss:ID="Number"><NumberFormat ss:Format="0.000"/><Alignment ss:Vertical="Center"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#D9E0E8"/></Borders></Style>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1F6FEB" ss:Pattern="Solid"/><Alignment ss:Vertical="Center"/></Style>
 </Styles>
 <Worksheet ss:Name="Склад"><Table>
  <Row><Cell ss:MergeAcross="${headers.length - 1}" ss:StyleID="Header"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row>
  ${xmlRows}
 </Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane></WorksheetOptions></Worksheet>
</Workbook>`;

    downloadBlob(
        new Blob([`\uFEFF${xml}`], { type: 'application/vnd.ms-excel;charset=utf-8' }),
        kind === 'oracal' ? 'sklad-oracal.xls' : 'sklad-materialy.xls',
    );
}

export function printStockPdf(
    items: ExportStockItem[],
    kind: 'standard' | 'oracal',
) {
    const selected = filterKind(items, kind);
    const title = kind === 'oracal'
        ? 'Актуальный склад ORACAL 641'
        : 'Актуальный склад обычных материалов';
    const headers = kind === 'oracal'
        ? ['Код и цвет', 'Ширина', 'Остаток', 'В пути', 'Минимум', 'Статус']
        : ['Категория', 'Материал', 'Остаток', 'В пути', 'Минимум', 'Статус'];
    const rows = selected.map((item) => kind === 'oracal'
        ? [
            `${item.colorCode ?? ''} ${item.colorName ?? item.materialName}`.trim(),
            item.widthMeters ? `${numberFormatter.format(item.widthMeters)} м` : '-',
            quantity(item.currentQuantity, item.unit),
            quantity(item.expectedQuantity, item.unit),
            quantity(item.minimumQuantity, item.unit),
            statusLabel(item),
        ]
        : [
            item.categoryName,
            materialDisplayName(item),
            quantity(item.currentQuantity, item.unit),
            quantity(item.expectedQuantity, item.unit),
            quantity(item.minimumQuantity, item.unit),
            statusLabel(item),
        ]);
    const report = window.open('', '_blank');
    if (!report) throw new Error('Браузер заблокировал окно печати. Разрешите всплывающие окна.');
    report.opener = null;

    report.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title><style>
      @page{size:A4 landscape;margin:12mm}body{font:12px Arial,sans-serif;color:#172033}h1{font-size:20px;margin:0 0 5px}p{margin:0 0 16px;color:#5d6878}table{width:100%;border-collapse:collapse}th{background:#1769d2;color:#fff;text-align:left;padding:8px}td{padding:7px 8px;border-bottom:1px solid #dce2ea;vertical-align:top}tr:nth-child(even) td{background:#f5f7fa}.meta{display:flex;justify-content:space-between}.low{color:#b3261e;font-weight:700}</style></head><body>
      <div class="meta"><div><h1>${escapeHtml(title)}</h1><p>Сформировано ${escapeHtml(new Date().toLocaleString('ru-RU'))}</p></div><strong>${selected.length} позиций</strong></div>
      <table><thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row, index) => `<tr${selected[index].belowMinimum ? ' class="low"' : ''}>${row.map((value) => `<td>${escapeHtml(String(value))}</td>`).join('')}</tr>`).join('')}</tbody></table>
      <script>window.addEventListener('load',()=>setTimeout(()=>window.print(),120));<\/script></body></html>`);
    report.document.close();
}

function filterKind(items: ExportStockItem[], kind: 'standard' | 'oracal') {
    return items.filter((item) => kind === 'oracal'
        ? item.kind === 'Oracal641'
        : item.kind !== 'Oracal641');
}

function statusLabel(item: ExportStockItem) {
    if (item.currentQuantity <= 0) return 'Нет на складе';
    return item.belowMinimum ? 'Ниже минимума' : 'В норме';
}

function quantity(value: number, unit: string) {
    return `${numberFormatter.format(value)} ${unitLabel(unit)}`;
}

function unitLabel(unit: string) {
    const labels: Record<string, string> = {
        Piece: 'шт.', Meter: 'м', SquareMeter: 'м²', Kilogram: 'кг',
        Liter: 'л', Roll: 'рул.', Sheet: 'лист',
    };
    return labels[unit] ?? unit;
}

function escapeXml(value: string) {
    return value.replace(/[<>&"']/g, (character) => ({
        '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
    })[character] ?? character);
}

function escapeHtml(value: string) {
    return escapeXml(value);
}

function downloadBlob(blob: Blob, fileName: string) {
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(href);
}

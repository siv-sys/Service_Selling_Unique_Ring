import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import {
  Download,
  Layers,
  RotateCcw,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  Link,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

const initialInventoryData = [
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOV78VY4Fdm2XWC_ux_phNkkWau0YDvVV8qRMt4lub-GHKKAKGNgyXf1Q2_kTbXi2K1lF0z2_0WZscl8d4RRsUbpP1WALcV0fcE3DkfAWjMjTH0McaIGLBudP_5IjCI8oXke5GEhMk2JVE05MT3kyAzVf07doF6J3Y5hsV4PpEcVcb8Vlthw1lc5bM7t77Nu-GVldwo-clQjGOWt69Sm0LTebvMEQBqoaC1MKeLyw32ZFmfRqpaz34hipy_IGOOM1KynvSKlSTp8iY',
    model: 'Gen 3 - Rose Gold',
    color: 'Rose Gold',
    variant: 'Size 7 - Premium Alloy',
    sku: 'SKU-G3-RG-07',
    serial: 'SN: 8820-XL-421',
    status: 'Low Stock',
    stock: 12,
    stockPercent: 15,
    statusColor: 'amber'
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuClU7KD3g2DAHs_y45M3ohuAYqp0BDE8ULQU56wCEAUXPigep9dSbsUMhQlpa_FKq5HRVy1oTPHLyZDmYYITQUawgwqc2IHCschz80w-ABhPYAOVaCQ_sYeZQ6I5Me0BXm_HI4536gPkpqJlSyrPTRZ-miV2tOYd4iD15e5djzVe-tcjUtd-uDpO3s9kXhlJjAvbF4GkWfsDoULNINM3GWboa4mnMee16Kh6XJ6HrpAwg8Qp9S08nKFpxtINwe-r5OTJevno4scRm9M',
    model: 'Classic Silver',
    color: 'Silver',
    variant: 'Size 9 - Polished Steel',
    sku: 'SKU-CLS-SV-09',
    serial: 'SN: 4492-CS-221',
    status: 'In Stock',
    stock: 84,
    stockPercent: 65,
    statusColor: 'emerald'
  },
  {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAtJbz4xoC06FWJPjntWC62FdOscgQpTGjCmWqmb2HiwN2tDHgOiTO6UOoiaMTeY2bOF2Koeg2W0Cg0d51UE4XuUyLXP19-1iFsobFBHJbcwmlBzH7RSeChY6dAKsAKEF0XBZhsq3s2T2rnKZFpVt5m0PHVV6kqt9Udbs_1ttQCYdytLuAep3VOx6-8Td2-UOTTlWadTPFm3xFttFHGW0Z9wpSwk7oDpnWLKt-x_Px40-BhpuqU4dtIKt-Uhh9s7y4bJwJ_Djgm6AQ_',
    model: 'Midnight Black',
    color: 'Black',
    variant: 'Size 12 - Carbon Fiber',
    sku: 'SKU-MID-BK-12',
    serial: 'SN: 7710-MB-003',
    status: 'Depleted',
    stock: 0,
    stockPercent: 0,
    statusColor: 'rose'
  }
];

const RingInventory = () => {
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastExport, setLastExport] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<'all' | 'sku' | 'critical' | 'active' | 'compliance'>('all');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedColor, setSelectedColor] = useState('All Colors');
  const [selectedStatus, setSelectedStatus] = useState('Any Status');
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<any>(null);

  const availableModels = useMemo(() => ['All Models', ...Array.from(new Set(inventoryData.map((item) => item.model)))], [inventoryData]);
  const availableColors = useMemo(() => ['All Colors', ...Array.from(new Set(inventoryData.map((item) => item.color)))], [inventoryData]);
  const availableStatuses = useMemo(() => ['Any Status', ...Array.from(new Set(inventoryData.map((item) => item.status)))], [inventoryData]);

  const filteredInventoryData = inventoryData.filter((item) => {
    const modelOk = selectedModel === 'All Models' || item.model === selectedModel;
    const colorOk = selectedColor === 'All Colors' || item.color === selectedColor;
    const statusOk = selectedStatus === 'Any Status' || item.status === selectedStatus;
    return modelOk && colorOk && statusOk;
  });

  const skuData = filteredInventoryData.filter((item) => item.sku.trim().length > 0);
  const criticalLowStockData = filteredInventoryData.filter(
    (item) =>
      item.statusColor === 'amber' ||
      item.statusColor === 'rose' ||
      item.status.toLowerCase().includes('low') ||
      item.stock === 0
  );
  const activeUnitsData = filteredInventoryData.filter(
    (item) =>
      item.statusColor === 'emerald' ||
      item.status.toLowerCase().includes('in stock') ||
      item.status.toLowerCase().includes('active')
  );
  const hardwareComplianceData = filteredInventoryData.filter(
    (item) => item.statusColor === 'emerald' && item.stock > 0
  );
  const totalSkuCount = new Set(skuData.map((item) => item.sku.trim())).size;
  const hardwareCompliancePercent = filteredInventoryData.length
    ? `${((hardwareComplianceData.length / filteredInventoryData.length) * 100).toFixed(1)}%`
    : '0.0%';

  const tableData =
    activeStatFilter === 'sku'
      ? skuData
      : activeStatFilter === 'critical'
        ? criticalLowStockData
        : activeStatFilter === 'active'
          ? activeUnitsData
          : activeStatFilter === 'compliance'
            ? hardwareComplianceData
          : filteredInventoryData;

  const getTimestamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const headers = ['Model', 'Variant', 'SKU', 'Serial', 'Status', 'Stock'];
    const rows = inventoryData.map((item) => [item.model, item.variant, item.sku, item.serial, item.status, String(item.stock)].join(','));
    const fileName = `inventory-export-${getTimestamp()}.csv`;
    downloadBlob(new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' }), fileName);
    setLastExport(fileName);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    const popup = window.open('', '_blank', 'width=1000,height=700');
    if (!popup) return;

    const rowsHtml = inventoryData
      .map((item) => `<tr><td>${item.model}</td><td>${item.variant}</td><td>${item.sku}</td><td>${item.serial}</td><td>${item.status}</td><td>${item.stock}</td></tr>`)
      .join('');

    popup.document.write(`
      <html><head><title>Inventory Export</title>
      <style>
        body{font-family:Arial,sans-serif;padding:20px;color:#0f172a}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
        th{background:#f8fafc}
      </style>
      </head><body>
      <h2>Inventory Export</h2>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <table><thead><tr><th>Model</th><th>Variant</th><th>SKU</th><th>Serial</th><th>Status</th><th>Stock</th></tr></thead><tbody>${rowsHtml}</tbody></table>
      </body></html>
    `);

    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
    setLastExport(`inventory-export-${getTimestamp()}.pdf`);
    setShowExportMenu(false);
  };

  const handleEditClick = (item: any) => {
    setEditingSku(item.sku);
    setEditDraft({ ...item });
  };

  const handleEditDraftChange = (field: string, value: string) => {
    setEditDraft((prev: any) => {
      if (!prev) return prev;

      const next = { ...prev, [field]: value };
      if (field === 'stock') {
        const numericStock = Math.max(0, Number(value) || 0);
        next.stock = numericStock;
        next.stockPercent = Math.min(100, Math.round((numericStock / 100) * 100));

        if (numericStock === 0) {
          next.status = 'Depleted';
          next.statusColor = 'rose';
        } else if (numericStock <= 20) {
          next.status = 'Low Stock';
          next.statusColor = 'amber';
        } else {
          next.status = 'In Stock';
          next.statusColor = 'emerald';
        }
      }
      return next;
    });
  };

  const handleCancelEdit = () => {
    setEditingSku(null);
    setEditDraft(null);
  };

  const handleSaveEdit = () => {
    if (!editingSku || !editDraft) return;
    setInventoryData((prev) => prev.map((item) => (item.sku === editingSku ? editDraft : item)));
    setEditingSku(null);
    setEditDraft(null);
  };

  return (
    <>
      <Header
        title="Ring Inventory Management"
        subtitle="Comprehensive lifecycle management for smart hardware assets."
      />

      <main className="flex-1 overflow-y-auto p-8 max-w-[1600px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ring Inventory Management</h1>
              <p className="text-slate-500 font-medium text-sm">Comprehensive lifecycle management for smart hardware assets.</p>
            </div>
            <div className="flex gap-2 relative">
              <button
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-4 h-4" /> Export
              </button>
              {showExportMenu && (
                <div className="absolute top-12 left-0 z-20 bg-white border border-slate-300 rounded-lg shadow-md min-w-[170px]">
                  <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-slate-50">Export Excel (.csv)</button>
                  <button onClick={handleExportPdf} className="w-full text-left px-4 py-2 text-sm text-slate-800 hover:bg-slate-50">Export PDF</button>
                </div>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors">
                <Layers className="w-4 h-4" /> Bulk Actions
              </button>
            </div>
          </div>
          {lastExport && <p className="text-xs font-semibold text-slate-700 mb-2">Last export: {lastExport}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InventoryStatCard
              title="Total SKU Count"
              value={String(totalSkuCount)}
              change="+12.4%"
              icon={Package}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'sku' ? 'all' : 'sku'))}
              active={activeStatFilter === 'sku'}
              subtext={activeStatFilter === 'sku' ? 'Showing valid SKU rows' : 'Click to manage table by SKU'}
            />
            <InventoryStatCard
              title="Critical/Low Stock"
              value={String(criticalLowStockData.length)}
              subtext={activeStatFilter === 'critical' ? 'Showing critical rows only' : 'Click to filter critical rows'}
              icon={AlertTriangle}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'critical' ? 'all' : 'critical'))}
              active={activeStatFilter === 'critical'}
            />
            <InventoryStatCard
              title="Active Units"
              value={String(activeUnitsData.length)}
              subtext={activeStatFilter === 'active' ? 'Showing active unit rows' : 'Click to filter active units'}
              icon={Link}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'active' ? 'all' : 'active'))}
              active={activeStatFilter === 'active'}
            />
            <InventoryStatCard
              title="Hardware Compliance"
              value={hardwareCompliancePercent}
              subtext={activeStatFilter === 'compliance' ? 'Showing compliance rows' : 'Click to filter compliance rows'}
              icon={CheckCircle2}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'compliance' ? 'all' : 'compliance'))}
              active={activeStatFilter === 'compliance'}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 mr-4 border-r border-slate-300 pr-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
            </div>
            <select
              value={selectedModel}
              onChange={(event) => setSelectedModel(event.target.value)}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              {availableModels.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <select
              value={selectedColor}
              onChange={(event) => setSelectedColor(event.target.value)}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              {availableColors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              {availableStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setSelectedModel('All Models');
                setSelectedColor('All Colors');
                setSelectedStatus('Any Status');
                setActiveStatFilter('all');
              }}
              className="ml-auto flex items-center gap-2 text-primary text-sm font-bold hover:underline"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-300">
                  <th className="p-4 w-10"><input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" /></th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Model & Variant</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">SKU / Serial</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Stock Level</th>
                  <th className="p-4 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {tableData.map((item) => (
                  <InventoryRow
                    key={item.sku}
                    {...item}
                    isEditing={editingSku === item.sku}
                    editDraft={editingSku === item.sku ? editDraft : null}
                    onEditClick={() => handleEditClick(item)}
                    onEditDraftChange={handleEditDraftChange}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-300 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{tableData.length ? `1-${tableData.length}` : '0-0'}</span> of {tableData.length} items
            </span>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-400 hover:text-primary transition-colors">
                <Download className="w-4 h-4 rotate-90" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-primary bg-primary text-white font-bold text-xs">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:border-primary hover:text-primary transition-colors font-bold text-xs">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-400 hover:text-primary transition-colors">
                <Download className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-500">
          <div className="flex items-center gap-6">
            <LegendItem color="emerald" label="Optimal" />
            <LegendItem color="amber" label="Reorder" />
            <LegendItem color="rose" label="Depleted" />
          </div>
          <p className="text-[11px] font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Last synchronized: 12 seconds ago (Real-time tracking enabled)
          </p>
        </div>
      </main>
    </>
  );
};

const InventoryStatCard = ({ title, value, change, subtext, icon: Icon, border, onClick, active }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full text-left flex flex-col gap-1 rounded-xl p-5 bg-white border ${border ? 'border-l-4 border-l-primary' : 'border-slate-300'} ${active ? 'ring-2 ring-primary/40 border-primary' : ''} shadow-sm relative overflow-hidden group`}
  >
    {!border && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-all group-hover:scale-110"></div>}
    <div className="flex items-center gap-3 text-slate-500 mb-2">
      <Icon className="w-5 h-5 text-primary" />
      <p className={`text-[11px] font-bold uppercase tracking-widest ${border ? 'text-primary' : ''}`}>{title}</p>
    </div>
    <div className="flex items-baseline gap-2">
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {change && <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{change}</span>}
      {subtext && <span className="text-slate-400 text-[10px] font-medium">{subtext}</span>}
    </div>
  </button>
);

const InventoryRow = ({
  image,
  model,
  variant,
  sku,
  serial,
  status,
  stock,
  stockPercent,
  statusColor,
  isEditing,
  editDraft,
  onEditClick,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit
}: any) => {
  const statusClasses: any = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200'
  };
  const barClasses: any = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };
  const current = isEditing && editDraft ? editDraft : { image, model, variant, sku, serial, status, stock, stockPercent, statusColor };

  return (
    <tr className="hover:bg-primary/5 transition-colors group">
      <td className="p-4"><input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" /></td>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden flex-shrink-0 shadow-sm">
            <img src={image} alt={model} className="w-full h-full object-cover" />
          </div>
          <div>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={current.model}
                  onChange={(event) => onEditDraftChange('model', event.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 w-full mb-1"
                />
                <input
                  type="text"
                  value={current.variant}
                  onChange={(event) => onEditDraftChange('variant', event.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-700 w-full"
                />
              </>
            ) : (
              <>
                <div className="font-bold text-slate-900">{model}</div>
                <div className="text-[11px] text-slate-500 font-medium">{variant}</div>
              </>
            )}
          </div>
        </div>
      </td>
      <td className="p-4">
        {isEditing ? (
          <>
            <input
              type="text"
              value={current.sku}
              onChange={(event) => onEditDraftChange('sku', event.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-mono text-slate-900 w-full mb-1"
            />
            <input
              type="text"
              value={current.serial}
              onChange={(event) => onEditDraftChange('serial', event.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-[10px] text-slate-700 w-full"
            />
          </>
        ) : (
          <>
            <div className="text-xs font-mono font-medium text-slate-700">{sku}</div>
            <div className="text-[10px] text-slate-400 font-medium uppercase">{serial}</div>
          </>
        )}
      </td>
      <td className="p-4">
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center w-[110px] text-center border shadow-sm ${statusClasses[current.statusColor]}`}>
          {current.status}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              type="number"
              min={0}
              value={current.stock}
              onChange={(event) => onEditDraftChange('stock', event.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 w-20"
            />
          ) : (
            <span className="font-bold text-slate-900 text-sm">{stock}</span>
          )}
          <div className="flex-1 w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${barClasses[current.statusColor]}`} style={{ width: `${current.stockPercent}%` }}></div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={onSaveEdit}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-slate-500 text-white border border-slate-600 hover:bg-slate-600 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onEditClick}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold bg-pink-600 text-white border border-pink-700 hover:bg-pink-700 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-2"
            >
              <Edit3 className="w-3 h-3" /> Edit
            </button>
          )}
          <button
            type="button"
            className="w-9 h-9 p-0 flex items-center justify-center border border-slate-500 text-slate-800 hover:text-white hover:border-rose-700 hover:bg-rose-700 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const LegendItem = ({ color, label }: any) => {
  const bgClasses: any = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2.5 h-2.5 rounded-full ${bgClasses[color]}`}></div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default RingInventory;

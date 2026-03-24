import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { api, resolveApiAssetUrl } from '../lib/api';
import {
  Download,
  Layers,
  RotateCcw,
  Search,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  Link,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

type InventoryItem = {
  id: number;
  image: string | null;
  model: string;
  color: string | null;
  variant: string;
  sku: string;
  serial: string;
  status: string;
  stock: number;
  stockPercent: number;
  statusColor: string;
  createdAt?: string;
  updatedAt?: string;
};

type InventoryResponse = {
  items: InventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
};

type InventoryFiltersResponse = {
  models: string[];
  statuses: string[];
};

type InventoryDraft = InventoryItem;
const ITEMS_PER_PAGE = 15;

const DEFAULT_FILTERS: InventoryFiltersResponse = {
  models: ['All Models'],
  statuses: ['Any Status']
};

const deriveInventoryState = (stockValue: number) => {
  const stock = Math.max(0, Number(stockValue) || 0);

  if (stock === 0) {
    return { stock, status: 'Depleted', statusColor: 'rose', stockPercent: 0 };
  }
  if (stock <= 20) {
    return { stock, status: 'Low Stock', statusColor: 'amber', stockPercent: Math.min(100, stock) };
  }
  return { stock, status: 'In Stock', statusColor: 'emerald', stockPercent: Math.min(100, stock) };
};

const RingInventory = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<InventoryFiltersResponse>(DEFAULT_FILTERS);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastExport, setLastExport] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<'all' | 'rows' | 'units' | 'low' | 'depleted'>('all');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedStatus, setSelectedStatus] = useState('Any Status');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<InventoryDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const loadFilterOptions = async () => {
    try {
      const response = await api.get<InventoryFiltersResponse>('/inventory/filters');
      setFilterOptions({
        models: Array.isArray(response.models) && response.models.length ? response.models : DEFAULT_FILTERS.models,
        statuses: Array.isArray(response.statuses) && response.statuses.length ? response.statuses : DEFAULT_FILTERS.statuses,
      });
    } catch {
      setFilterOptions(DEFAULT_FILTERS);
    }
  };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (selectedModel !== 'All Models') params.set('model', selectedModel);
      if (selectedStatus !== 'Any Status') params.set('status', selectedStatus);

      const response = await api.get<InventoryResponse>(`/inventory?${params.toString()}`);
      setInventoryData(Array.isArray(response.items) ? response.items : []);
      setTotalRows(Number(response.pagination?.total || 0));
      setLastSyncedAt(new Date().toISOString());
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load inventory from backend.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadInventory();
  }, [selectedModel, selectedStatus]);

  const availableModels = useMemo(() => {
    if (filterOptions.models.length) return filterOptions.models;
    return ['All Models', ...Array.from(new Set(inventoryData.map((item) => item.model)))];
  }, [filterOptions.models, inventoryData]);

  const availableStatuses = useMemo(() => {
    if (filterOptions.statuses.length) return filterOptions.statuses;
    return ['Any Status', ...Array.from(new Set(inventoryData.map((item) => item.status)))];
  }, [filterOptions.statuses, inventoryData]);

  const lowStockData = inventoryData.filter(
    (item) =>
      item.statusColor === 'amber' ||
      item.status.toLowerCase().includes('low')
  );
  const depletedData = inventoryData.filter(
    (item) =>
      item.statusColor === 'rose' ||
      item.status.toLowerCase().includes('depleted') ||
      item.stock === 0
  );
  const totalUnitsInStock = inventoryData.reduce((sum, item) => sum + Math.max(0, Number(item.stock || 0)), 0);

  const baseTableData =
    activeStatFilter === 'rows'
      ? inventoryData
      : activeStatFilter === 'units'
        ? inventoryData.filter((item) => item.stock > 0)
        : activeStatFilter === 'low'
          ? lowStockData
          : activeStatFilter === 'depleted'
            ? depletedData
            : inventoryData;
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const tableData = normalizedSearchTerm
    ? baseTableData.filter((item) =>
        [item.model, item.variant, item.sku, item.serial, item.color || '', item.status]
          .some((value) => String(value || '').toLowerCase().includes(normalizedSearchTerm))
      )
    : baseTableData;
  const totalPages = Math.max(1, Math.ceil(tableData.length / ITEMS_PER_PAGE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedTableData = tableData.slice(
    (currentPageSafe - 1) * ITEMS_PER_PAGE,
    currentPageSafe * ITEMS_PER_PAGE
  );
  const pageStart = tableData.length ? (currentPageSafe - 1) * ITEMS_PER_PAGE + 1 : 0;
  const pageEnd = tableData.length ? Math.min(currentPageSafe * ITEMS_PER_PAGE, tableData.length) : 0;
  const visiblePageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, currentPageSafe - 2),
    Math.max(5, currentPageSafe + 1)
  );

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
    const rows = tableData.map((item) => [item.model, item.variant, item.sku, item.serial, item.status, String(item.stock)].join(','));
    const fileName = `inventory-export-${getTimestamp()}.csv`;
    downloadBlob(new Blob([headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' }), fileName);
    setLastExport(fileName);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    const popup = window.open('', '_blank', 'width=1000,height=700');
    if (!popup) return;

    const rowsHtml = tableData
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

  const handleEditClick = (item: InventoryItem) => {
    setEditingSku(item.sku);
    setEditDraft({ ...item });
  };

  const handleEditDraftChange = (field: keyof InventoryDraft, value: string) => {
    setEditDraft((prev) => {
      if (!prev) return prev;

      const next = { ...prev, [field]: value };
      if (field === 'stock') {
        const derived = deriveInventoryState(Number(value));
        next.stock = derived.stock;
        next.stockPercent = derived.stockPercent;
        next.status = derived.status;
        next.statusColor = derived.statusColor;
      }
      return next;
    });
  };

  const handleCancelEdit = () => {
    setEditingSku(null);
    setEditDraft(null);
  };

  const handleSaveEdit = async () => {
    if (!editDraft) return;

    setSavingId(editDraft.id);
    try {
      const updated = await api.put<InventoryItem>(`/inventory/${editDraft.id}`, {
        image: editDraft.image,
        model: editDraft.model,
        color: editDraft.color,
        variant: editDraft.variant,
        sku: editDraft.sku,
        serial: editDraft.serial,
        status: editDraft.status,
        stock: editDraft.stock,
        stockPercent: editDraft.stockPercent,
        statusColor: editDraft.statusColor,
      });

      setInventoryData((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setEditingSku(null);
      setEditDraft(null);
      setError('');
      setLastSyncedAt(new Date().toISOString());
      await loadFilterOptions();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save inventory item.'));
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const confirmed = window.confirm(`Delete ${item.model} (${item.sku}) from inventory?`);
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await api.delete(`/inventory/${item.id}`);
      setInventoryData((current) => current.filter((currentItem) => currentItem.id !== item.id));
      if (editingSku === item.sku) {
        setEditingSku(null);
        setEditDraft(null);
      }
      setError('');
      setLastSyncedAt(new Date().toISOString());
      await loadFilterOptions();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete inventory item.'));
    } finally {
      setDeletingId(null);
    }
  };

  const syncLabel = lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'Waiting for sync';

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedModel, selectedStatus, activeStatFilter]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <>
      <style>{`
        .dark .inventory-page .bg-white {
          background-color: #111827 !important;
        }

        .dark .inventory-page .bg-slate-50,
        .dark .inventory-page .bg-slate-50\\/50,
        .dark .inventory-page .bg-slate-100 {
          background-color: #1f2937 !important;
        }

        .dark .inventory-page .border-slate-300,
        .dark .inventory-page .border-slate-200 {
          border-color: #374151 !important;
        }

        .dark .inventory-page .text-slate-900,
        .dark .inventory-page .text-slate-800 {
          color: #f3f4f6 !important;
        }

        .dark .inventory-page .text-slate-700,
        .dark .inventory-page .text-slate-600,
        .dark .inventory-page .text-slate-500,
        .dark .inventory-page .text-slate-400 {
          color: #94a3b8 !important;
        }
      `}</style>
      <Header
        title="Ring Inventory"
        subtitle="Database-backed view of rows stored in inventory_items."
      />

      <main className="inventory-page flex-1 overflow-y-auto p-8 max-w-[1600px] w-full mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Ring Inventory</h1>
              <p className="text-slate-500 font-medium text-sm">Live inventory data from the `inventory_items` table.</p>
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
              <button
                type="button"
                onClick={loadInventory}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors"
              >
                <Layers className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
          {error && <p className="text-xs font-semibold text-rose-600 mb-2">{error}</p>}
          {lastExport && <p className="text-xs font-semibold text-slate-700 mb-2">Last export: {lastExport}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InventoryStatCard
              title="Inventory Rows"
              value={String(totalRows)}
              change="+Live"
              icon={Package}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'rows' ? 'all' : 'rows'))}
              active={activeStatFilter === 'rows'}
              subtext={activeStatFilter === 'rows' ? 'Showing all inventory rows' : 'Click to show all rows'}
            />
            <InventoryStatCard
              title="Units In Stock"
              value={String(totalUnitsInStock)}
              subtext={activeStatFilter === 'units' ? 'Showing rows with stock on hand' : 'Click to show stocked rows'}
              icon={AlertTriangle}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'units' ? 'all' : 'units'))}
              active={activeStatFilter === 'units'}
            />
            <InventoryStatCard
              title="Low Stock Rows"
              value={String(lowStockData.length)}
              subtext={activeStatFilter === 'low' ? 'Showing low stock rows only' : 'Click to filter low stock rows'}
              icon={Link}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'low' ? 'all' : 'low'))}
              active={activeStatFilter === 'low'}
            />
            <InventoryStatCard
              title="Depleted Rows"
              value={String(depletedData.length)}
              subtext={activeStatFilter === 'depleted' ? 'Showing depleted rows only' : 'Click to filter depleted rows'}
              icon={CheckCircle2}
              color="primary"
              onClick={() => setActiveStatFilter((prev) => (prev === 'depleted' ? 'all' : 'depleted'))}
              active={activeStatFilter === 'depleted'}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 mr-4 border-r border-slate-300 pr-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
            </div>
            <div className="relative min-w-[220px] flex-1 max-w-[340px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search ring, SKU, serial..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 focus:border-primary focus:ring-primary/20"
              />
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
                setSelectedStatus('Any Status');
                setSearchTerm('');
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
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Model / Variant / Color</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">SKU / Serial</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Stock Level</th>
                  <th className="p-4 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-500">Loading inventory from backend...</td>
                  </tr>
                ) : paginatedTableData.length ? (
                  paginatedTableData.map((item) => (
                    <InventoryRow
                      key={item.id}
                      {...item}
                      isEditing={editingSku === item.sku}
                      isSaving={savingId === item.id}
                      isDeleting={deletingId === item.id}
                      editDraft={editingSku === item.sku ? editDraft : null}
                      onEditClick={() => handleEditClick(item)}
                      onEditDraftChange={handleEditDraftChange}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDelete={() => handleDeleteItem(item)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-sm text-slate-500">No inventory items matched the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-300 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">{`${pageStart}-${pageEnd}`}</span> of {tableData.length} filtered row(s)
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPageSafe === 1}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-400 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="w-4 h-4 rotate-90" />
              </button>
              {visiblePageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-8 h-8 flex items-center justify-center rounded border font-bold text-xs transition-colors ${
                    currentPageSafe === pageNumber
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-300 bg-white text-slate-600 hover:text-primary'
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPageSafe === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-400 hover:text-primary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
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
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Last synchronized: {syncLabel}
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
  color,
  variant,
  sku,
  serial,
  status,
  stock,
  stockPercent,
  statusColor,
  isEditing,
  isSaving,
  isDeleting,
  editDraft,
  onEditClick,
  onEditDraftChange,
  onSaveEdit,
  onCancelEdit,
  onDelete
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
  const current = isEditing && editDraft ? editDraft : { image, model, color, variant, sku, serial, status, stock, stockPercent, statusColor };
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onEditDraftChange('image', reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  return (
    <tr className="hover:bg-primary/5 transition-colors group">
      <td className="p-4"><input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" /></td>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden flex-shrink-0 shadow-sm">
            {current.image ? (
              <img src={resolveApiAssetUrl(current.image)} alt={current.model} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">IMG</div>
            )}
          </div>
          <div>
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={current.image || ''}
                  onChange={(event) => onEditDraftChange('image', event.target.value)}
                  placeholder="Image URL"
                  className="border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-700 w-full mb-1"
                />
                <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-pink-200 bg-pink-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-pink-700 hover:bg-pink-100">
                  Upload Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <input
                  type="text"
                  value={current.model}
                  onChange={(event) => onEditDraftChange('model', event.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-xs font-semibold text-slate-900 w-full mt-2 mb-1"
                />
                <input
                  type="text"
                  value={current.variant}
                  onChange={(event) => onEditDraftChange('variant', event.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-700 w-full mb-1"
                />
                <input
                  type="text"
                  value={current.color || ''}
                  onChange={(event) => onEditDraftChange('color', event.target.value)}
                  className="border border-slate-300 rounded px-2 py-1 text-[11px] text-slate-700 w-full"
                />
              </>
            ) : (
              <>
                <div className="font-bold text-slate-900">{model}</div>
                <div className="text-[11px] text-slate-500 font-medium">{variant}</div>
                <div className="text-[10px] text-slate-400 font-medium">{color || 'No color'}</div>
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
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center w-[110px] text-center border shadow-sm ${statusClasses[current.statusColor] || statusClasses.emerald}`}>
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
            <div className={`h-full ${barClasses[current.statusColor] || barClasses.emerald}`} style={{ width: `${current.stockPercent}%` }}></div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-2">
          {isEditing ? (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={onSaveEdit}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={onCancelEdit}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-slate-500 text-white border border-slate-600 hover:bg-slate-600 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-60"
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
            disabled={isDeleting}
            onClick={onDelete}
            className="w-9 h-9 p-0 flex items-center justify-center border border-slate-500 text-slate-800 hover:text-white hover:border-rose-700 hover:bg-rose-700 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:opacity-60"
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

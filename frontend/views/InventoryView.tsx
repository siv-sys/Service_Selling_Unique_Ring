import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import {
  Download,
  RotateCcw,
  Edit3,
  Trash2,
  Package,
  AlertTriangle,
  Link,
  CheckCircle2,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const API_URL = 'http://localhost:4000/api/inventory';
const ITEMS_PER_PAGE = 20;

interface InventoryItem {
  id: number;
  image: string;
  model: string;
  color: string;
  variant: string;
  sku: string;
  serial: string;
  status: string;
  stock: number;
  stockPercent: number;
  statusColor: string;
  supplier?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Filters {
  models: string[];
  colors: string[];
  statuses: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const RingInventory = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [filters, setFilters] = useState<Filters>({ models: ['All Models'], colors: ['All Colors'], statuses: ['Any Status'] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [lastExport, setLastExport] = useState('');
  const [activeStatFilter, setActiveStatFilter] = useState<'all' | 'sku' | 'critical' | 'active' | 'compliance'>('all');
  const [selectedModel, setSelectedModel] = useState('All Models');
  const [selectedColor, setSelectedColor] = useState('All Colors');
  const [selectedStatus, setSelectedStatus] = useState('Any Status');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: ITEMS_PER_PAGE, total: 0 });

  // Fetch inventory data from API with pagination
  const fetchInventory = useCallback(async (page = currentPage) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(ITEMS_PER_PAGE));
      if (selectedModel !== 'All Models') params.append('model', selectedModel);
      if (selectedColor !== 'All Colors') params.append('color', selectedColor);
      if (selectedStatus !== 'Any Status') params.append('status', selectedStatus);

      const response = await fetch(`${API_URL}?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      
      const data = await response.json();
      setInventoryData(data.items || []);
      setPagination(data.pagination || { page, limit: ITEMS_PER_PAGE, total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedModel, selectedColor, selectedStatus]);

  // Pagination handlers
  const totalPages = Math.ceil(pagination.total / ITEMS_PER_PAGE);
  
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    fetchInventory(validPage);
  };
  
  const goToPrevPage = () => goToPage(currentPage - 1);
  const goToNextPage = () => goToPage(currentPage + 1);
  
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  // Fetch filter options
  const fetchFilters = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/filters`);
      if (!response.ok) throw new Error('Failed to fetch filters');
      
      const data = await response.json();
      setFilters({
        models: data.models || ['All Models'],
        colors: data.colors || ['All Colors'],
        statuses: data.statuses || ['Any Status'],
      });
    } catch (err) {
      console.error('Failed to fetch filters:', err);
    }
  }, []);

  useEffect(() => {
    fetchFilters();
  }, [fetchFilters]);

  useEffect(() => {
    setCurrentPage(1);
    fetchInventory(1);
  }, [selectedModel, selectedColor, selectedStatus]);

  // Calculate stats from current page data
  const skuData = inventoryData.filter((item) => item.sku?.trim().length > 0);
  const criticalLowStockData = inventoryData.filter(
    (item) =>
      item.statusColor === 'amber' ||
      item.statusColor === 'rose' ||
      item.status?.toLowerCase().includes('low') ||
      item.stock === 0
  );
  const activeUnitsData = inventoryData.filter(
    (item) =>
      item.statusColor === 'emerald' ||
      item.status?.toLowerCase().includes('in stock') ||
      item.status?.toLowerCase().includes('active')
  );
  const hardwareComplianceData = inventoryData.filter(
    (item) => item.statusColor === 'emerald' && item.stock > 0
  );
  const totalSkuCount = new Set(skuData.map((item) => item.sku?.trim())).size;
  const hardwareCompliancePercent = inventoryData.length
    ? `${((hardwareComplianceData.length / inventoryData.length) * 100).toFixed(1)}%`
    : '0.0%';

  // Display data based on stat filter (local filtering on current page)
  const displayData =
    activeStatFilter === 'sku'
      ? skuData
      : activeStatFilter === 'critical'
        ? criticalLowStockData
        : activeStatFilter === 'active'
          ? activeUnitsData
          : activeStatFilter === 'compliance'
            ? hardwareComplianceData
          : inventoryData;

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

  const handleEditClick = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditDraft({ ...item });
  };

  const handleEditDraftChange = (field: string, value: string | number) => {
    setEditDraft((prev) => {
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
    setEditingId(null);
    setEditDraft(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editDraft) return;
    
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to update item');
      }

      // Update local state
      setInventoryData((prev) => prev.map((item) => (item.id === editingId ? editDraft : item)));
      setEditingId(null);
      setEditDraft(null);
      
      // Refresh data from server
      fetchInventory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setDeletingId(id);
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      setInventoryData((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetFilters = () => {
    setSelectedModel('All Models');
    setSelectedColor('All Colors');
    setSelectedStatus('Any Status');
    setActiveStatFilter('all');
    setCurrentPage(1);
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
              <button 
                onClick={fetchInventory}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            </div>
          </div>
          {lastExport && <p className="text-xs font-semibold text-slate-700 mb-2">Last export: {lastExport}</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
            </div>
          )}

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
              {filters.models.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            <select
              value={selectedColor}
              onChange={(event) => setSelectedColor(event.target.value)}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              {filters.colors.map((color) => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              {filters.statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleResetFilters}
              className="ml-auto flex items-center gap-2 text-primary text-sm font-bold hover:underline"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2 text-slate-500">Loading inventory...</span>
              </div>
            ) : displayData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <Package className="w-12 h-12 mb-4 text-slate-300" />
                <p className="font-medium">No inventory items found</p>
                <p className="text-sm">Try adjusting your filters or add new items</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-300">
                    <th className="p-4 w-10"><input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" /></th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Model & Variant</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">SKU / Serial</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Supplier</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Stock Level</th>
                    <th className="p-4 text-[11px] font-bold text-slate-700 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {displayData.map((item) => (
                    <InventoryRow
                      key={item.id}
                      {...item}
                      isEditing={editingId === item.id}
                      editDraft={editingId === item.id ? editDraft : null}
                      saving={saving}
                      deleting={deletingId === item.id}
                      onEditClick={() => handleEditClick(item)}
                      onEditDraftChange={handleEditDraftChange}
                      onSaveEdit={handleSaveEdit}
                      onCancelEdit={handleCancelEdit}
                      onDelete={() => handleDelete(item.id)}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && pagination.total > 0 && (
            <div className="p-4 border-t border-slate-300 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500 font-medium">
                Showing <span className="font-bold text-slate-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, pagination.total)}</span> of {pagination.total} items
              </span>
              <div className="flex gap-1 items-center">
                <button 
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-400 hover:text-pink-600 hover:border-pink-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-slate-400">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => goToPage(page as number)}
                      className={`w-8 h-8 flex items-center justify-center rounded border font-bold text-xs transition-colors ${
                        currentPage === page
                          ? 'border-pink-500 bg-pink-500 text-white'
                          : 'border-slate-300 bg-white text-slate-600 hover:border-pink-300 hover:text-pink-600'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ))}
                <button 
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 bg-white text-slate-400 hover:text-pink-600 hover:border-pink-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-slate-500">
          <div className="flex items-center gap-6">
            <LegendItem color="emerald" label="Optimal" />
            <LegendItem color="amber" label="Reorder" />
            <LegendItem color="rose" label="Depleted" />
          </div>
          <p className="text-[11px] font-medium flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Last synchronized: {new Date().toLocaleTimeString()}
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
  id,
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
  supplier,
  isEditing,
  editDraft,
  saving,
  deleting,
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
  const current = isEditing && editDraft ? editDraft : { image, model, color, variant, sku, serial, status, stock, stockPercent, statusColor, supplier };

  return (
    <tr className="hover:bg-primary/5 transition-colors group">
      <td className="p-4"><input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" /></td>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-300 overflow-hidden flex-shrink-0 shadow-sm">
            {current.image ? (
              <img src={current.image} alt={current.model} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <Package className="w-6 h-6" />
              </div>
            )}
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
        {isEditing ? (
          <input
            type="text"
            value={current.supplier || ''}
            onChange={(event) => onEditDraftChange('supplier', event.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-xs text-slate-900 w-full"
            placeholder="Supplier name"
          />
        ) : (
          <div className="text-xs text-slate-600">{supplier || '-'}</div>
        )}
      </td>
      <td className="p-4">
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center w-[110px] text-center border shadow-sm ${statusClasses[current.statusColor] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
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
            <div className={`h-full ${barClasses[current.statusColor] || 'bg-slate-400'}`} style={{ width: `${current.stockPercent}%` }}></div>
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
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                Save
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-extrabold bg-slate-500 text-white border border-slate-600 hover:bg-slate-600 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 disabled:opacity-50"
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
            onClick={onDelete}
            disabled={deleting}
            className="w-9 h-9 p-0 flex items-center justify-center border border-slate-500 text-slate-800 hover:text-white hover:border-rose-700 hover:bg-rose-700 rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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

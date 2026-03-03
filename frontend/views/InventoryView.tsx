import React, { useState } from 'react';
import Header from '../components/Header';
import {
  Search,
  Plus,
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

const inventoryItems = [
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCOV78VY4Fdm2XWC_ux_phNkkWau0YDvVV8qRMt4lub-GHKKAKGNgyXf1Q2_kTbXi2K1lF0z2_0WZscl8d4RRsUbpP1WALcV0fcE3DkfAWjMjTH0McaIGLBudP_5IjCI8oXke5GEhMk2JVE05MT3kyAzVf07doF6J3Y5hsV4PpEcVcb8Vlthw1lc5bM7t77Nu-GVldwo-clQjGOWt69Sm0LTebvMEQBqoaC1MKeLyw32ZFmfRqpaz34hipy_IGOOM1KynvSKlSTp8iY',
    model: 'Gen 3 - Rose Gold',
    variant: 'Size 7 - Premium Alloy',
    sku: 'SKU-G3-RG-07',
    serial: 'SN: 8820-XL-421',
    status: 'Low Stock',
    stock: 12,
    stockPercent: 15,
    statusColor: 'amber'
  },
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuClU7KD3g2DAHs_y45M3ohuAYqp0BDE8ULQU56wCEAUXPigep9dSbsUMhQlpa_FKq5HRVy1oTPHLyZDmYYITQUawgwqc2IHCschz80w-ABhPYAOVaCQ_sYeZQ6I5Me0BXm_HI4536gPkpqJlSyrPTRZ-miV2tOYd4iD15e5djzVe-tcjUtd-uDpO3s9kXhlJjAvbF4GkWfsDoULNINM3GWboa4mnMee16Kh6XJ6HrpAwg8Qp9S08nKFpxtINwe-r5OTJevno4scRm9M',
    model: 'Classic Silver',
    variant: 'Size 9 - Polished Steel',
    sku: 'SKU-CLS-SV-09',
    serial: 'SN: 4492-CS-221',
    status: 'In Stock',
    stock: 84,
    stockPercent: 65,
    statusColor: 'emerald'
  },
  {
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAtJbz4xoC06FWJPjntWC62FdOscgQpTGjCmWqmb2HiwN2tDHgOiTO6UOoiaMTeY2bOF2Koeg2W0Cg0d51UE4XuUyLXP19-1iFsobFBHJbcwmlBzH7RSeChY6dAKsAKEF0XBZhsq3s2T2rnKZFpVt5m0PHVV6kqt9Udbs_1ttQCYdytLuAep3VOx6-8Td2-UOTTlWadTPFm3xFttFHGW0Z9wpSwk7oDpnWLKt-x_Px40-BhpuqU4dtIKt-Uhh9s7y4bJwJ_Djgm6AQ_',
    model: 'Midnight Black',
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const defaultFilters = {
    model: 'All Models',
    color: 'All Colors',
    status: 'Any Status'
  };
  const [filters, setFilters] = useState(defaultFilters);

  const getTimestamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const escapeHtml = (value: string) =>
    value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const handleExportExcel = () => {
    const header = ['Model', 'Variant', 'SKU', 'Serial', 'Status', 'Stock'];
    const rows = inventoryItems.map((item) => [
      item.model,
      item.variant,
      item.sku,
      item.serial,
      item.status,
      String(item.stock)
    ]);

    const tableHtml = `
      <table>
        <thead><tr>${header.map((cell) => `<th>${escapeHtml(cell)}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows
            .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join('')}</tr>`)
            .join('')}
        </tbody>
      </table>
    `;

    const blob = new Blob([`\ufeff${tableHtml}`], {
      type: 'application/vnd.ms-excel;charset=utf-8;'
    });

    downloadBlob(blob, `inventory-${getTimestamp()}.xls`);
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    const pdfWindow = window.open('', '_blank', 'width=960,height=720');
    if (!pdfWindow) {
      window.alert('Please allow popups to export PDF.');
      return;
    }

    const rowsHtml = inventoryItems
      .map(
        (item) =>
          `<tr>
            <td>${escapeHtml(item.model)}</td>
            <td>${escapeHtml(item.variant)}</td>
            <td>${escapeHtml(item.sku)}</td>
            <td>${escapeHtml(item.serial)}</td>
            <td>${escapeHtml(item.status)}</td>
            <td>${item.stock}</td>
          </tr>`
      )
      .join('');

    pdfWindow.document.write(`
      <html>
        <head>
          <title>Inventory Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1 { margin: 0 0 8px; font-size: 20px; }
            p { margin: 0 0 16px; color: #475569; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Ring Inventory Export</h1>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Model</th>
                <th>Variant</th>
                <th>SKU</th>
                <th>Serial</th>
                <th>Status</th>
                <th>Stock</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);

    pdfWindow.document.close();
    pdfWindow.focus();
    setTimeout(() => pdfWindow.print(), 250);
    setShowExportMenu(false);
  };

  const handleResetFilters = () => {
    setFilters(defaultFilters);
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
                <div className="absolute top-12 left-0 bg-white border border-slate-200 shadow-md rounded-lg z-20 min-w-[170px]">
                  <button
                    onClick={handleExportExcel}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-t-lg"
                  >
                    Export Excel (.xls)
                  </button>
                  <button
                    onClick={handleExportPdf}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-b-lg"
                  >
                    Export PDF
                  </button>
                </div>
              )}
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:opacity-90 transition-colors">
                <Layers className="w-4 h-4" /> Bulk Actions
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InventoryStatCard title="Total SKU Count" value="2,148" change="+12.4%" icon={Package} color="primary" />
            <InventoryStatCard
              title="Critical/Low Stock"
              value="24"
              subtext="Restock required"
              icon={AlertTriangle}
              color="primary"
              border
            />
            <InventoryStatCard title="Active Units" value="1,284" subtext="59.8% Deployment" icon={Link} color="primary" />
            <InventoryStatCard title="Hardware Compliance" value="99.2%" subtext="Passed QC" icon={CheckCircle2} color="primary" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filter:</span>
            </div>
            <select
              value={filters.model}
              onChange={(event) => setFilters((prev) => ({ ...prev, model: event.target.value }))}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              <option>All Models</option>
              <option>Gen 3 Elite</option>
              <option>Pro Series</option>
            </select>
            <select
              value={filters.color}
              onChange={(event) => setFilters((prev) => ({ ...prev, color: event.target.value }))}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              <option>All Colors</option>
              <option>Rose Gold</option>
              <option>Stealth Black</option>
            </select>
            <select
              value={filters.status}
              onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
              className="bg-slate-50 border-slate-200 rounded-lg text-sm focus:border-primary focus:ring-primary/20 min-w-[160px] py-2"
            >
              <option>Any Status</option>
              <option>In Stock</option>
              <option>Low Stock</option>
            </select>
            <button onClick={handleResetFilters} className="ml-auto flex items-center gap-2 text-primary text-sm font-bold hover:underline">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-200">
                  <th className="p-4 w-10">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" />
                  </th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Model & Variant</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">SKU / Serial</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Stock Level</th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryItems.map((item) => (
                  <InventoryRow
                    key={item.sku}
                    image={item.image}
                    model={item.model}
                    variant={item.variant}
                    sku={item.sku}
                    serial={item.serial}
                    status={item.status}
                    stock={item.stock}
                    stockPercent={item.stockPercent}
                    statusColor={item.statusColor}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-700">1-3</span> of 248 items
            </span>
            <div className="flex gap-1">
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-primary transition-colors">
                <Download className="w-4 h-4 rotate-90" />
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-primary bg-primary text-white font-bold text-xs">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary transition-colors font-bold text-xs">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-primary transition-colors">
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

const InventoryStatCard = ({ title, value, change, subtext, icon: Icon, border }: any) => (
  <div
    className={`flex flex-col gap-1 rounded-xl p-5 bg-white border ${
      border ? 'border-l-4 border-l-primary' : 'border-slate-200'
    } shadow-sm relative overflow-hidden group`}
  >
    {!border && <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full transition-all group-hover:scale-110"></div>}
    <div className="flex items-center gap-3 text-slate-500 mb-2">
      <Icon className={`w-5 h-5 ${border ? 'text-primary' : 'text-primary'}`} />
      <p className={`text-[11px] font-bold uppercase tracking-widest ${border ? 'text-primary' : ''}`}>{title}</p>
    </div>
    <div className="flex items-baseline gap-2">
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {change && <span className="text-emerald-500 text-xs font-bold bg-emerald-50 px-1.5 py-0.5 rounded">{change}</span>}
      {subtext && <span className="text-slate-400 text-[10px] font-medium">{subtext}</span>}
    </div>
  </div>
);

const InventoryRow = ({ image, model, variant, sku, serial, status, stock, stockPercent, statusColor }: any) => {
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

  return (
    <tr className="hover:bg-primary/5 transition-colors group">
      <td className="p-4">
        <input type="checkbox" className="rounded text-primary focus:ring-primary border-slate-300" />
      </td>
      <td className="p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
            <img src={image} alt={model} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-slate-900">{model}</div>
            <div className="text-[11px] text-slate-500 font-medium">{variant}</div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="text-xs font-mono font-medium text-slate-700">{sku}</div>
        <div className="text-[10px] text-slate-400 font-medium uppercase">{serial}</div>
      </td>
      <td className="p-4">
        <span
          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center justify-center w-[110px] text-center border shadow-sm ${
            statusClasses[statusColor]
          }`}
        >
          {status}
        </span>
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 text-sm">{stock}</span>
          <div className="flex-1 w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${barClasses[statusColor]}`} style={{ width: `${stockPercent}%` }}></div>
          </div>
        </div>
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white hover:bg-primary-dark rounded-lg text-xs font-bold shadow-sm transition-all">
            <Edit3 className="w-3 h-3" /> Edit
          </button>
          <button className="w-9 h-9 p-0 flex items-center justify-center border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 rounded-lg transition-all">
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

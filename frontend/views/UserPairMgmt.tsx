import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { api, resolveApiAssetUrl } from '../lib/api';
import {
  Users,
  Link2Off,
  RefreshCw,
  ShieldAlert,
  Search,
  Filter,
  FileText,
  Table as TableIcon,
  Eye,
  BarChart2,
  Link,
  Trash2,
  Smartphone,
  Cpu
} from 'lucide-react';

type PairSummary = {
  totalPairs: number;
  connectedPairs: number;
  revokedPairs: number;
  pendingPairs: number;
  totalActiveUsers: number;
  disconnectedPairs: number;
  outdatedFirmware: number;
  suspendedAccounts: number;
};

type PairItem = {
  id: number;
  names: string;
  memberAvatars?: Array<string | null>;
  pairCode: string;
  pairStatus: 'CONNECTED' | 'PENDING' | 'SYNCING' | 'SUSPENDED' | 'UNPAIRED';
  accessLevel: 'FULL_ACCESS' | 'LIMITED' | 'REVOKED';
  memberCount: number;
  deviceLabel: string;
  pairId: string;
  tier: 'Executive' | 'Standard' | 'Guest';
  ring: string;
  ringModel: string;
  os: string;
  platform: 'iOS' | 'Android' | 'Unknown';
  status: 'Active' | 'Pending' | 'Disabled';
  firmware: 'Updated' | 'Outdated';
  accountState: 'Active' | 'Suspended';
  lastActive: string;
  lastActiveAt: string | null;
  enabled: boolean;
  disabled: boolean;
};

type PairResponse = {
  summary: PairSummary;
  items: PairItem[];
};

const EMPTY_SUMMARY: PairSummary = {
  totalPairs: 0,
  connectedPairs: 0,
  revokedPairs: 0,
  pendingPairs: 0,
  totalActiveUsers: 0,
  disconnectedPairs: 0,
  outdatedFirmware: 0,
  suspendedAccounts: 0,
};

const PAGE_SIZE = 10;

const UserPairMgmt = () => {
  const [summary, setSummary] = useState<PairSummary>(EMPTY_SUMMARY);
  const [userPairs, setUserPairs] = useState<PairItem[]>([]);
  const [summaryFilter, setSummaryFilter] = useState<'all' | 'connected' | 'revoked' | 'suspended'>('all');
  const [selectedExport, setSelectedExport] = useState<'excel' | 'pdf'>('excel');
  const [selectedPage, setSelectedPage] = useState(1);
  const [lastExportedFile, setLastExportedFile] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRingModel, setSelectedRingModel] = useState('All Models');
  const [selectedAccessLevel, setSelectedAccessLevel] = useState('Any Access');
  const [selectedLastActiveRange, setSelectedLastActiveRange] = useState('Any Time');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyPairId, setBusyPairId] = useState<number | null>(null);

  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error && err.message) return err.message;
    return fallback;
  };

  const loadPairs = async () => {
    setLoading(true);
    try {
      const response = await api.get<PairResponse>('/admin/pairs');
      setSummary(response.summary || EMPTY_SUMMARY);
      setUserPairs(Array.isArray(response.items) ? response.items : []);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load pair management data from backend.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPairs();
  }, []);

  const availableModels = useMemo(
    () => ['All Models', ...Array.from(new Set(userPairs.map((pair) => pair.ringModel).filter(Boolean)))],
    [userPairs]
  );

  const activeWithinRange = (pair: PairItem) => {
    if (selectedLastActiveRange === 'Any Time' || !pair.lastActiveAt) return true;

    const lastActiveMs = new Date(pair.lastActiveAt).getTime();
    if (!Number.isFinite(lastActiveMs)) return false;

    const diffMs = Date.now() - lastActiveMs;
    if (selectedLastActiveRange === 'Last 24 Hours') return diffMs <= 24 * 60 * 60 * 1000;
    if (selectedLastActiveRange === 'Last 7 Days') return diffMs <= 7 * 24 * 60 * 60 * 1000;
    if (selectedLastActiveRange === 'Last 30 Days') return diffMs <= 30 * 24 * 60 * 60 * 1000;
    return true;
  };

  const visibleUserPairs = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    const filtered = userPairs.filter((pair) => {
      const summaryOk =
        summaryFilter === 'connected'
          ? pair.pairStatus === 'CONNECTED' || pair.pairStatus === 'SYNCING'
          : summaryFilter === 'revoked'
            ? pair.accessLevel === 'REVOKED'
            : summaryFilter === 'suspended'
              ? pair.accountState === 'Suspended'
              : true;

      const searchOk =
        !search ||
        [pair.names, pair.pairCode, pair.ring, pair.ringModel, pair.deviceLabel]
          .join(' ')
          .toLowerCase()
          .includes(search);

      const modelOk = selectedRingModel === 'All Models' || pair.ringModel === selectedRingModel;
      const accessOk = selectedAccessLevel === 'Any Access' || pair.accessLevel === selectedAccessLevel;

      return summaryOk && searchOk && modelOk && accessOk && activeWithinRange(pair);
    });

    return filtered;
  }, [userPairs, summaryFilter, searchTerm, selectedRingModel, selectedAccessLevel, selectedLastActiveRange]);

  useEffect(() => {
    setSelectedPage(1);
  }, [summaryFilter, searchTerm, selectedRingModel, selectedAccessLevel, selectedLastActiveRange]);

  const totalPages = Math.max(1, Math.ceil(visibleUserPairs.length / PAGE_SIZE));
  const pagedPairs = visibleUserPairs.slice((selectedPage - 1) * PAGE_SIZE, selectedPage * PAGE_SIZE);

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
    const headers = ['Pair Code', 'Members', 'Pair Status', 'Access Level', 'Member Count', 'Ring', 'Ring Model', 'Device', 'Account Status', 'Last Active'];
    const rows = visibleUserPairs.map((pair) =>
      [pair.pairCode, pair.names, pair.pairStatus, pair.accessLevel, pair.memberCount, pair.ring, pair.ringModel, pair.deviceLabel, pair.accountState, pair.lastActive].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const fileName = `userpair-export-${getTimestamp()}.csv`;
    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), fileName);
    setLastExportedFile(fileName);
  };

  const handleExportPdf = () => {
    const popup = window.open('', '_blank', 'width=1000,height=700');
    if (!popup) {
      window.alert('Please allow popups to export PDF.');
      return;
    }

    const rowsHtml = visibleUserPairs
      .map(
        (pair) => `
        <tr>
          <td>${pair.pairCode}</td>
          <td>${pair.names}</td>
          <td>${pair.pairStatus}</td>
          <td>${pair.accessLevel}</td>
          <td>${pair.memberCount}</td>
          <td>${pair.ring}</td>
          <td>${pair.ringModel}</td>
          <td>${pair.deviceLabel}</td>
          <td>${pair.accountState}</td>
          <td>${pair.lastActive}</td>
        </tr>`
      )
      .join('');

    popup.document.write(`
      <html>
        <head>
          <title>UserPair Export</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
            h2 { margin: 0 0 10px 0; }
            p { margin: 0 0 14px 0; color: #475569; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px; text-align: left; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>UserPair Management Export</h2>
          <p>Generated: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                <th>Pair Code</th><th>Members</th><th>Pair Status</th><th>Access Level</th><th>Member Count</th><th>Ring</th><th>Ring Model</th><th>Device</th><th>Account Status</th><th>Last Active</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 250);
    setLastExportedFile(`userpair-export-${getTimestamp()}.pdf`);
  };

  const handleTogglePair = async (pair: PairItem) => {
    setBusyPairId(pair.id);
    try {
      const response = await api.patch<{ item: PairItem }>(`/admin/pairs/${pair.id}/enabled`, {
        enabled: !pair.enabled,
      });
      setUserPairs((current) => current.map((item) => (item.id === pair.id ? response.item : item)));
      await loadPairs();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update pair access.'));
    } finally {
      setBusyPairId(null);
    }
  };

  const handleDeletePair = async (pair: PairItem) => {
    const confirmed = window.confirm(`Delete ${pair.names} (${pair.pairCode}) from the admin list?`);
    if (!confirmed) return;

    setBusyPairId(pair.id);
    try {
      await api.delete(`/admin/pairs/${pair.id}`);
      setUserPairs((current) => current.filter((item) => item.id !== pair.id));
      await loadPairs();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete pair.'));
    } finally {
      setBusyPairId(null);
    }
  };

  const entrance = (delayMs: number): React.CSSProperties => ({
    animation: `fadeUp 560ms cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms both`,
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translate3d(0, 14px, 0) scale(0.985); }
          to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
        }
        @keyframes softPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(236, 19, 128, 0); }
          50% { box-shadow: 0 0 0 8px rgba(236, 19, 128, 0.08); }
        }
        .btn-contrast {
          font-weight: 700;
          border: 1px solid rgba(15, 23, 42, 0.18);
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.05);
          outline: none;
        }
        .btn-contrast:focus-visible {
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.2), 0 0 0 6px rgba(236, 19, 128, 0.35);
        }
        .btn-contrast-neutral {
          background: #ffffff;
          color: #0f172a;
          border-color: rgba(15, 23, 42, 0.32);
        }
        .btn-contrast-neutral:hover {
          background: #f8fafc;
        }
        .btn-contrast-primary {
          background: #ec1380;
          color: #ffffff;
          border-color: #be0f66;
        }
        .btn-contrast-primary:hover {
          background: #be0f66;
        }
        .btn-contrast-danger {
          background: #ef4444;
          color: #ffffff;
          border-color: #b91c1c;
        }
        .btn-contrast-danger:hover {
          background: #b91c1c;
        }
        .toggle-contrast {
          border: 1px solid rgba(15, 23, 42, 0.28);
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
          outline: none;
        }
        .toggle-contrast:focus-visible {
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.2), 0 0 0 6px rgba(236, 19, 128, 0.35);
        }
        .toggle-on {
          background: #15803d;
          border-color: #14532d;
        }
        .toggle-off {
          background: #1e293b;
          border-color: #0f172a;
        }
      `}</style>
      <style>{`
        .dark .userpair-page .bg-white {
          background-color: #111827 !important;
        }

        .dark .userpair-page .bg-slate-50,
        .dark .userpair-page .bg-slate-50\\/30,
        .dark .userpair-page .bg-slate-200 {
          background-color: #1f2937 !important;
        }

        .dark .userpair-page .border-primary\\/5,
        .dark .userpair-page .border-slate-400,
        .dark .userpair-page .border-slate-300 {
          border-color: #374151 !important;
        }

        .dark .userpair-page .text-slate-900,
        .dark .userpair-page .text-slate-800 {
          color: #f3f4f6 !important;
        }

        .dark .userpair-page .text-slate-700,
        .dark .userpair-page .text-slate-600,
        .dark .userpair-page .text-slate-500 {
          color: #94a3b8 !important;
        }
      `}</style>
      <Header
        title="User & Pair Management Console"
        subtitle="Database-backed view of relationship pairs, linked rings, and account access"
      />

      <main className="userpair-page flex-1 overflow-y-auto bg-slate-50/50 p-8 dark:bg-slate-950">
        {error && <p className="mb-4 text-xs font-semibold text-rose-600">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div style={entrance(40)}>
            <SummaryCard
              title="Total Pairs"
              value={String(summary.totalPairs)}
              status="Database Live"
              icon={Users}
              color="green"
              active={summaryFilter === 'all'}
              onClick={() => setSummaryFilter('all')}
            />
          </div>
          <div style={entrance(90)}>
            <SummaryCard
              title="Connected Pairs"
              value={String(summary.connectedPairs)}
              status="Pair Status"
              icon={Link2Off}
              color="amber"
              active={summaryFilter === 'connected'}
              onClick={() => setSummaryFilter((prev) => (prev === 'connected' ? 'all' : 'connected'))}
            />
          </div>
          <div style={entrance(140)}>
            <SummaryCard
              title="Revoked Access"
              value={String(summary.revokedPairs)}
              status="Access Level"
              icon={RefreshCw}
              color="primary"
              active={summaryFilter === 'revoked'}
              onClick={() => setSummaryFilter((prev) => (prev === 'revoked' ? 'all' : 'revoked'))}
            />
          </div>
          <div style={entrance(190)}>
            <SummaryCard
              title="Suspended Members"
              value={String(summary.suspendedAccounts)}
              status="Account Status"
              icon={ShieldAlert}
              color="red"
              active={summaryFilter === 'suspended'}
              onClick={() => setSummaryFilter((prev) => (prev === 'suspended' ? 'all' : 'suspended'))}
            />
          </div>
        </div>

        <div
          style={entrance(250)}
          className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-primary/5 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by member, pair code, ring, or device..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button
                type="button"
                onClick={loadPairs}
                className="btn-contrast btn-contrast-neutral flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm hover:-translate-y-0.5 transition-all duration-200"
              >
                <Filter className="w-4 h-4" />
                Refresh Data
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 mr-2 uppercase font-bold tracking-wider">Export:</span>
              <button
                onClick={() => {
                  setSelectedExport('excel');
                  handleExportExcel();
                }}
                className={`btn-contrast p-2 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedExport === 'excel'
                    ? 'btn-contrast-primary shadow-md'
                    : 'btn-contrast-neutral'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedExport('pdf');
                  handleExportPdf();
                }}
                className={`btn-contrast p-2 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedExport === 'pdf'
                    ? 'btn-contrast-primary shadow-md'
                    : 'btn-contrast-neutral'
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
          {lastExportedFile && (
            <p className="text-xs font-semibold text-slate-700 mb-4">Last export: {lastExportedFile}</p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
            <FilterSelect label="Ring Model" value={selectedRingModel} options={availableModels} onChange={setSelectedRingModel} />
            <FilterSelect label="Access Level" value={selectedAccessLevel} options={['Any Access', 'FULL_ACCESS', 'LIMITED', 'REVOKED']} onChange={setSelectedAccessLevel} />
            <FilterSelect label="Last Active Range" value={selectedLastActiveRange} options={['Any Time', 'Last 24 Hours', 'Last 7 Days', 'Last 30 Days']} onChange={setSelectedLastActiveRange} />
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRingModel('All Models');
                  setSelectedAccessLevel('Any Access');
                  setSelectedLastActiveRange('Any Time');
                  setSummaryFilter('all');
                }}
                className="btn-contrast btn-contrast-primary w-full py-2.5 rounded-lg text-sm hover:-translate-y-0.5 transition-all duration-200"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div
          style={entrance(320)}
          className="bg-white rounded-xl shadow-sm border border-primary/5 overflow-hidden hover:shadow-md transition-shadow duration-300"
        >
          {summaryFilter !== 'all' && (
            <div className="px-6 py-3 border-b border-primary/10 bg-green-50 flex items-center justify-between">
              <p className="text-sm font-semibold text-green-800">
                {summaryFilter === 'connected'
                  ? 'Showing connected pair rows only'
                  : summaryFilter === 'revoked'
                    ? 'Showing revoked-access pair rows only'
                    : 'Showing suspended-member pair rows only'}
              </p>
              <button
                onClick={() => setSummaryFilter('all')}
                className="btn-contrast btn-contrast-neutral px-3 py-1.5 rounded-lg text-xs"
              >
                Show All Pairs
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-primary/5">
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-700">Enable</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-700">Pair Members</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-700">Pair Status</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-700">Access / Ring</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-700">Account State</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-700">Last Active</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-700 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-slate-500">Loading pair management data...</td>
                  </tr>
                ) : pagedPairs.length ? (
                  pagedPairs.map((pair) => (
                    <UserRow
                      key={pair.id}
                      pair={pair}
                      busy={busyPairId === pair.id}
                      onToggle={() => handleTogglePair(pair)}
                      onDelete={() => handleDeletePair(pair)}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-sm text-slate-500">No pair records matched the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-6 border-t border-primary/5 flex items-center justify-between">
            <p className="text-sm text-slate-700 italic">System Admin Access: displaying {visibleUserPairs.length} relationship pair row(s) from MySQL</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={selectedPage <= 1}
                onClick={() => setSelectedPage((page) => Math.max(1, page - 1))}
                className="btn-contrast btn-contrast-neutral px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).slice(0, 5).map((page) => (
                  <button
                    key={page}
                    onClick={() => setSelectedPage(page)}
                    className={`btn-contrast w-10 h-10 rounded-lg text-sm transition-all duration-200 hover:-translate-y-0.5 ${
                      selectedPage === page
                        ? 'btn-contrast-primary shadow-md'
                        : 'btn-contrast-neutral'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={selectedPage >= totalPages}
                onClick={() => setSelectedPage((page) => Math.min(totalPages, page + 1))}
                className="btn-contrast btn-contrast-neutral px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
              >
                Next Page
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

const SummaryCard = ({ title, value, status, icon: Icon, color, onClick, active }: any) => {
  const colorClasses: any = {
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    primary: "bg-primary/10 text-primary",
    red: "bg-red-100 text-red-600"
  };
  const statusClasses: any = {
    green: "text-green-500 bg-green-50",
    amber: "text-amber-500 bg-amber-50",
    primary: "text-primary bg-primary/5",
    red: "text-red-500 bg-red-50"
  };
  const activeClasses: any = {
    green: 'border-green-400 ring-2 ring-green-200',
    amber: 'border-amber-400 ring-2 ring-amber-200',
    primary: 'border-[#be0f66] ring-2 ring-[#ec1380]/30',
    red: 'border-red-400 ring-2 ring-red-200'
  };

  return (
    <button
      onClick={onClick}
      className={`relative w-full text-left bg-white p-6 rounded-xl border ${
        active ? activeClasses[color] : 'border-primary/5'
      } shadow-sm group hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${colorClasses[color]}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${statusClasses[color]}`}>{status}</span>
      </div>
      <h3 className="text-slate-700 text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-1 text-slate-900">{value}</p>
    </button>
  );
};

const FilterSelect = ({ label, options, value, onChange }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{label}</label>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full bg-slate-50 border-none rounded-lg py-2 text-sm focus:ring-2 focus:ring-primary/30"
    >
      {options.map((opt: string) => <option key={opt}>{opt}</option>)}
    </select>
  </div>
);

const UserRow = ({ pair, busy, onToggle, onDelete }: any) => {
  const [selectedAction, setSelectedAction] = useState<'view' | 'chart' | 'link' | 'delete' | null>(null);
  const OSIcon = pair.platform === 'Android' ? Cpu : Smartphone;
  const memberNames = String(pair.names || '').split('&').map((name: string) => name.trim()).filter(Boolean);
  const memberAvatars = Array.isArray(pair.memberAvatars) ? pair.memberAvatars : [];

  const renderAvatar = (name: string | undefined, avatarUrl: string | null | undefined, className: string) => {
    const label = name || 'User';
    const resolvedAvatar = avatarUrl ? resolveApiAssetUrl(avatarUrl) : '';
    if (resolvedAvatar) {
      return <img className={className} src={resolvedAvatar} alt={label} />;
    }

    return (
      <div className={`${className} bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold`}>
        {label.slice(0, 1).toUpperCase()}
      </div>
    );
  };

  return (
    <tr className={`hover:bg-primary/5 transition-all duration-200 group ${pair.disabled ? 'bg-slate-50/30' : 'hover:translate-x-0.5'}`}>
      <td className="p-5">
        <div className="inline-flex items-center gap-2">
          <button
            onClick={onToggle}
            disabled={busy}
            role="switch"
            aria-checked={pair.enabled}
            aria-label={`${pair.names} ${pair.enabled ? 'on' : 'off'}`}
            className={`toggle-contrast relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out ${pair.enabled ? 'toggle-on' : 'toggle-off'} ${busy ? 'opacity-60' : ''}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${pair.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span
            className={`min-w-[2.75rem] text-center text-[10px] font-bold uppercase px-2 py-1 rounded border ${
              pair.enabled
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-slate-200 text-slate-800 border-slate-400'
            }`}
          >
            {pair.enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </td>
      <td className="p-5">
        <div className={`flex items-center gap-4 ${pair.disabled ? 'grayscale opacity-70' : ''}`}>
          <div className="relative w-12 h-8">
            {renderAvatar(memberNames[0], memberAvatars[0], 'absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover z-10')}
            {renderAvatar(memberNames[1], memberAvatars[1], 'absolute left-4 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover z-0')}
          </div>
          <div>
            <p className={`text-sm font-bold ${pair.disabled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{pair.names}</p>
            <p className={`text-[11px] ${pair.disabled ? 'text-slate-500 italic' : 'text-slate-700'}`}>{pair.pairCode}</p>
            <p className="text-[10px] text-slate-500 mt-1">{pair.memberCount} member(s)</p>
          </div>
        </div>
      </td>
      <td className="p-5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
          pair.pairStatus === 'CONNECTED' || pair.pairStatus === 'SYNCING'
            ? 'text-green-700 bg-green-100 border-green-300'
            : pair.pairStatus === 'PENDING'
              ? 'text-primary bg-primary/10 border-primary/20'
              : 'text-slate-700 bg-slate-100 border-slate-300'
        }`}>
          {pair.pairStatus}
        </span>
      </td>
      <td className="p-5">
        <div>
          <p className={`text-sm font-semibold ${pair.disabled ? 'text-slate-500 line-through' : 'text-slate-800'}`}>{pair.accessLevel}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <OSIcon className={`w-3 h-3 ${pair.platform === 'Android' ? 'text-blue-700' : 'text-slate-700'}`} />
            <span className="text-xs text-slate-700">{pair.deviceLabel}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-1">{pair.ring}</p>
          <p className="text-[10px] text-slate-500">{pair.ringModel}</p>
        </div>
      </td>
      <td className="p-5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
          pair.accountState === 'Active' ? 'bg-green-100 text-green-700' :
          pair.accountState === 'Suspended' ? 'bg-rose-100 text-rose-700' :
          'bg-slate-900 text-white'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            pair.accountState === 'Active' ? 'bg-green-500' :
            pair.accountState === 'Suspended' ? 'bg-rose-500' :
            'bg-slate-400'
          }`} />
          {pair.accountState}
        </span>
        <p className="mt-2 text-[11px] text-slate-500">{pair.enabled ? 'Access enabled' : 'Access disabled'}</p>
      </td>
      <td className="p-5 text-sm text-slate-600">{pair.lastActive}</td>
      <td className="p-5 text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setSelectedAction('view')}
            className={`btn-contrast p-1.5 rounded transition-all duration-200 hover:-translate-y-0.5 ${
              selectedAction === 'view'
                ? 'btn-contrast-primary shadow-md'
                : 'btn-contrast-neutral text-slate-600'
            }`}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedAction('chart')}
            className={`btn-contrast p-1.5 rounded transition-all duration-200 hover:-translate-y-0.5 ${
              selectedAction === 'chart'
                ? 'btn-contrast-primary shadow-md'
                : 'btn-contrast-neutral text-slate-600'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedAction('link')}
            className={`btn-contrast p-1.5 rounded transition-all duration-200 hover:-translate-y-0.5 ${
              selectedAction === 'link'
                ? 'btn-contrast-primary shadow-md'
                : 'btn-contrast-neutral text-slate-600'
            }`}
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedAction('delete');
              onDelete();
            }}
            disabled={busy}
            className={`btn-contrast p-1.5 rounded transition-all duration-200 hover:-translate-y-0.5 ${
              selectedAction === 'delete'
                ? 'btn-contrast-danger shadow-md'
                : 'btn-contrast-neutral text-slate-600'
            } ${busy ? 'opacity-60' : ''}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserPairMgmt;

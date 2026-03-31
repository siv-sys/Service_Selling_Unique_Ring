import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { api, resolveApiAssetUrl } from '../lib/api';
import {
  Users,
  Link2Off,
  RefreshCw,
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
          border: 1px solid rgba(15, 23, 42, 0.2);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.35),
            0 8px 18px rgba(15, 23, 42, 0.08);
          outline: none;
          transition:
            background 320ms cubic-bezier(0.22, 1, 0.36, 1),
            border-color 320ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 320ms cubic-bezier(0.22, 1, 0.36, 1),
            transform 220ms ease;
        }
        .toggle-contrast:focus-visible {
          box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.2), 0 0 0 6px rgba(236, 19, 128, 0.35);
        }
        .toggle-contrast:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow:
            inset 0 1px 1px rgba(255, 255, 255, 0.45),
            0 14px 24px rgba(15, 23, 42, 0.12);
        }
        .toggle-contrast:active:not(:disabled) {
          transform: translateY(0) scale(0.98);
        }
        .toggle-on {
          background: linear-gradient(135deg, #15803d 0%, #1f9d4e 100%);
          border-color: #166534;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 14px 24px rgba(34, 197, 94, 0.24);
        }
        .toggle-off {
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
          border-color: #334155;
        }
        .toggle-thumb {
          background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
          box-shadow:
            0 8px 18px rgba(15, 23, 42, 0.18),
            0 1px 2px rgba(15, 23, 42, 0.12);
          transition:
            transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
            box-shadow 320ms cubic-bezier(0.22, 1, 0.36, 1),
            width 220ms ease;
          will-change: transform;
        }
        .toggle-contrast:hover:not(:disabled) .toggle-thumb {
          box-shadow:
            0 12px 22px rgba(15, 23, 42, 0.2),
            0 1px 2px rgba(15, 23, 42, 0.12);
        }
        .toggle-contrast:active:not(:disabled) .toggle-thumb {
          width: 22px;
        }
        .toggle-chip {
          transition:
            background-color 240ms ease,
            border-color 240ms ease,
            color 240ms ease,
            transform 220ms ease,
            box-shadow 240ms ease;
        }
        .toggle-chip.on {
          box-shadow: 0 10px 20px rgba(34, 197, 94, 0.14);
        }
        .toggle-chip.off {
          box-shadow: 0 8px 14px rgba(100, 116, 139, 0.12);
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

        <div className="mb-6 rounded-[24px] border border-primary/10 bg-white p-2.5 shadow-[0_22px_54px_-42px_rgba(15,23,42,0.32)]">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
  const palette: any = {
    green: {
      shell: 'border-emerald-200/80 hover:border-emerald-300/90',
      glow: 'from-emerald-300/20 via-emerald-200/10 to-transparent',
      icon: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
      badge: 'border-emerald-100 bg-emerald-50 text-emerald-700',
      dot: 'bg-emerald-500',
      helper: 'text-emerald-700',
      active: 'border-emerald-400 ring-2 ring-emerald-200 shadow-[0_18px_34px_-24px_rgba(16,185,129,0.4)]'
    },
    amber: {
      shell: 'border-amber-200/80 hover:border-amber-300/90',
      glow: 'from-amber-300/20 via-amber-200/10 to-transparent',
      icon: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
      badge: 'border-amber-100 bg-amber-50 text-amber-700',
      dot: 'bg-amber-500',
      helper: 'text-amber-700',
      active: 'border-amber-400 ring-2 ring-amber-200 shadow-[0_18px_34px_-24px_rgba(245,158,11,0.4)]'
    },
    primary: {
      shell: 'border-rose-200/80 hover:border-rose-300/90',
      glow: 'from-rose-300/20 via-pink-200/10 to-transparent',
      icon: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
      badge: 'border-rose-100 bg-rose-50 text-rose-700',
      dot: 'bg-rose-500',
      helper: 'text-rose-700',
      active: 'border-rose-400 ring-2 ring-rose-200 shadow-[0_18px_34px_-24px_rgba(225,29,72,0.34)]'
    },
    red: {
      shell: 'border-red-200/80 hover:border-red-300/90',
      glow: 'from-red-300/20 via-red-200/10 to-transparent',
      icon: 'bg-red-50 text-red-600 ring-1 ring-red-100',
      badge: 'border-red-100 bg-red-50 text-red-700',
      dot: 'bg-red-500',
      helper: 'text-red-700',
      active: 'border-red-400 ring-2 ring-red-200 shadow-[0_18px_34px_-24px_rgba(239,68,68,0.4)]'
    }
  };
  const theme = palette[color] || palette.primary;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative isolate w-full overflow-hidden rounded-[20px] border bg-white px-4 py-3.5 text-left transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-32px_rgba(15,23,42,0.28)] ${
        active ? theme.active : `${theme.shell} shadow-[0_14px_28px_-24px_rgba(15,23,42,0.24)]`
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-12 bg-gradient-to-br ${theme.glow}`} />
      <div className="absolute -right-6 -top-8 h-20 w-20 rounded-full bg-white/70 blur-3xl" />

      <div className="relative flex h-full flex-col">
        <div
          className="mb-2.5 flex items-start justify-between gap-2.5"
        >
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-[15px] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition-transform duration-300 group-hover:scale-105 ${theme.icon}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.2em] ${theme.badge}`}>
            {status}
          </span>
        </div>

        <div className="space-y-0.5">
          <h3 className="text-[14px] font-semibold tracking-tight text-slate-700">{title}</h3>
          <p className="text-[1.85rem] font-semibold leading-none tracking-tight text-slate-900 sm:text-[1.95rem]">{value}</p>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
            <span className={`h-2 w-2 rounded-full ${active ? theme.dot : 'bg-slate-300'}`} />
            <span className={active ? theme.helper : ''}>{active ? 'Currently applied' : 'Click to filter'}</span>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 transition-transform duration-300 group-hover:translate-x-0.5">
            {active ? 'Live' : 'Focus'}
          </span>
        </div>
      </div>
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
            className={`toggle-contrast relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border ${pair.enabled ? 'toggle-on' : 'toggle-off'} ${busy ? 'opacity-60' : ''}`}
          >
            <span
              className={`toggle-thumb pointer-events-none inline-block h-5 w-5 rounded-full ${pair.enabled ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
          <span
            className={`toggle-chip min-w-[3rem] text-center text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg border ${
              pair.enabled
                ? 'on bg-green-100 text-green-800 border-green-300'
                : 'off bg-slate-200 text-slate-700 border-slate-300'
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

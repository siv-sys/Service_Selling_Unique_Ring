import React, { useState } from 'react';
import Header from '../components/Header';
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

const UserPairMgmt = () => {
  const [toggles, setToggles] = useState({
    pair1: true,
    pair2: true,
    pair3: false
  });
  const [selectedExport, setSelectedExport] = useState<'table' | 'file'>('table');
  const [selectedPage, setSelectedPage] = useState(1);

  const togglePair = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
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
          border-color: rgba(15, 23, 42, 0.22);
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
          background: #334155;
          border-color: #0f172a;
        }
      `}</style>
      <Header 
        title="User & Pair Management Console" 
        subtitle="Comprehensive control over accounts and active ring couplings" 
        showProvisionButton
      />
      
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div style={entrance(40)}>
            <SummaryCard 
            title="Total Active Users" 
            value="1,204" 
            status="Active Now" 
            icon={Users} 
            color="green"
          />
          </div>
          <div style={entrance(90)}>
            <SummaryCard 
            title="Disconnected Pairs" 
            value="42" 
            status="Requires Sync" 
            icon={Link2Off} 
            color="amber"
          />
          </div>
          <div style={entrance(140)}>
            <SummaryCard 
            title="Outdated Firmware" 
            value="18" 
            status="Action Required" 
            icon={RefreshCw} 
            color="primary"
            highlight
          />
          </div>
          <div style={entrance(190)}>
            <SummaryCard 
            title="Suspended Accounts" 
            value="7" 
            status="Security Risk" 
            icon={ShieldAlert} 
            color="red"
          />
          </div>
        </div>

        {/* Filters Section */}
        <div
          style={entrance(250)}
          className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-primary/5 hover:shadow-md transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or phone..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <button className="btn-contrast btn-contrast-neutral flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm hover:-translate-y-0.5 transition-all duration-200">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 mr-2 uppercase font-bold tracking-wider">Export:</span>
              <button
                onClick={() => setSelectedExport('table')}
                className={`btn-contrast p-2 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedExport === 'table'
                    ? 'btn-contrast-primary shadow-md'
                    : 'btn-contrast-neutral'
                }`}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedExport('file')}
                className={`btn-contrast p-2 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 ${
                  selectedExport === 'file'
                    ? 'btn-contrast-primary shadow-md'
                    : 'btn-contrast-neutral'
                }`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
            <FilterSelect label="Ring Model" options={['All Models', 'Gen 3 Pro', 'Gen 3 Lite']} />
            <FilterSelect label="OS Platform" options={['Any OS', 'iOS', 'Android']} />
            <FilterSelect label="Last Active Range" options={['Last 24 Hours', 'Last 7 Days', 'Last 30 Days']} />
            <div className="flex items-end">
              <button className="btn-contrast btn-contrast-primary w-full py-2.5 rounded-lg text-sm hover:-translate-y-0.5 transition-all duration-200">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div
          style={entrance(320)}
          className="bg-white rounded-xl shadow-sm border border-primary/5 overflow-hidden hover:shadow-md transition-shadow duration-300"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-primary/5">
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-500">Enable</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-500">Lover Pairs</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-500">Tier</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-500">Ring & OS</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-500">Last Active</th>
                  <th className="p-5 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                <UserRow 
                  id="pair1"
                  names="Sarah & Alex"
                  pairId="PR-9210"
                  tier="Executive"
                  ring="SR-90112"
                  os="iOS 17.4"
                  osIcon={Smartphone}
                  status="Active"
                  lastActive="2m ago"
                  enabled={toggles.pair1}
                  onToggle={() => togglePair('pair1')}
                />
                <UserRow 
                  id="pair2"
                  names="Elara & Jordan"
                  pairId="PR-5521"
                  tier="Standard"
                  ring="SR-90553"
                  os="Android 14"
                  osIcon={Cpu}
                  status="Pending"
                  lastActive="Never"
                  enabled={toggles.pair2}
                  onToggle={() => togglePair('pair2')}
                />
                <UserRow 
                  id="pair3"
                  names="Marcus & Sam"
                  pairId="Access Revoked"
                  tier="Guest"
                  ring="SR-88421"
                  os="Hardware Locked"
                  osIcon={Smartphone}
                  status="Disabled"
                  lastActive="14 days ago"
                  enabled={toggles.pair3}
                  onToggle={() => togglePair('pair3')}
                  disabled
                />
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-primary/5 flex items-center justify-between">
            <p className="text-sm text-slate-500 italic">System Admin Access: Displaying localized server records for 1,204 accounts</p>
            <div className="flex items-center gap-2">
              <button className="btn-contrast btn-contrast-neutral px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:-translate-y-0.5">Previous</button>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((page) => (
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
              <button className="btn-contrast btn-contrast-neutral px-4 py-2 text-sm rounded-lg transition-all duration-200 hover:-translate-y-0.5">Next Page</button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

const SummaryCard = ({ title, value, status, icon: Icon, color, highlight }: any) => {
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

  return (
    <div className={`bg-white p-6 rounded-xl border ${highlight ? 'border-primary/40 ring-2 ring-primary/20' : 'border-primary/5'} shadow-sm group hover:border-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}>
      <div className="flex justify-between items-start mb-4">
        <div
          className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${colorClasses[color]}`}
          style={highlight ? { animation: 'softPulse 2.2s ease-in-out infinite' } : undefined}
        >
          <Icon className="w-6 h-6" />
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${statusClasses[color]}`}>{status}</span>
      </div>
      <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-primary' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
};

const FilterSelect = ({ label, options }: any) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <select className="w-full bg-slate-50 border-none rounded-lg py-2 text-sm focus:ring-2 focus:ring-primary/30">
      {options.map((opt: string) => <option key={opt}>{opt}</option>)}
    </select>
  </div>
);

const UserRow = ({ id, names, pairId, tier, ring, os, osIcon: OSIcon, status, lastActive, enabled, onToggle, disabled }: any) => {
  const [selectedAction, setSelectedAction] = useState<'view' | 'chart' | 'link' | 'delete' | null>(null);

  return (
    <tr className={`hover:bg-primary/5 transition-all duration-200 group ${disabled ? 'bg-slate-50/30' : 'hover:translate-x-0.5'}`}>
      <td className="p-5">
        <div className="inline-flex items-center gap-2">
          <button
            onClick={onToggle}
            role="switch"
            aria-checked={enabled}
            aria-label={`${id} ${enabled ? 'on' : 'off'}`}
            className={`toggle-contrast relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out ${enabled ? 'toggle-on' : 'toggle-off'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span
            className={`min-w-[2.75rem] text-center text-[10px] font-bold uppercase px-2 py-1 rounded border ${
              enabled
                ? 'bg-green-100 text-green-800 border-green-300'
                : 'bg-slate-200 text-slate-800 border-slate-400'
            }`}
          >
            {enabled ? 'ON' : 'OFF'}
          </span>
        </div>
      </td>
      <td className="p-5">
        <div className={`flex items-center gap-4 ${disabled ? 'grayscale opacity-70' : ''}`}>
          <div className="relative w-12 h-8">
            <img className="absolute left-0 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover z-10" src={`https://picsum.photos/seed/${names.split(' ')[0]}/100`} alt="" />
            <img className="absolute left-4 top-0 w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover z-0" src={`https://picsum.photos/seed/${names.split(' ')[2]}/100`} alt="" />
          </div>
          <div>
            <p className={`text-sm font-bold ${disabled ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{names}</p>
            <p className={`text-[11px] ${disabled ? 'text-slate-400 italic' : 'text-slate-500'}`}>{pairId}</p>
          </div>
        </div>
      </td>
      <td className="p-5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
          tier === 'Executive' ? 'text-primary bg-primary/10 border-primary/20' : 
          tier === 'Standard' ? 'text-slate-500 bg-slate-100 border-slate-200' :
          'text-slate-400 bg-slate-50 border-slate-100'
        }`}>
          {tier}
        </span>
      </td>
      <td className="p-5">
        <div>
          <p className={`text-sm font-semibold ${disabled ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{ring}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <OSIcon className={`w-3 h-3 ${disabled ? 'text-slate-400' : 'text-blue-500'}`} />
            <span className="text-xs text-slate-500">{os}</span>
          </div>
        </div>
      </td>
      <td className="p-5">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
          status === 'Active' ? 'bg-green-100 text-green-700' :
          status === 'Pending' ? 'bg-primary/10 text-primary' :
          'bg-slate-900 text-white'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            status === 'Active' ? 'bg-green-500' :
            status === 'Pending' ? 'bg-primary animate-pulse' :
            'bg-slate-400'
          }`} />
          {status}
        </span>
      </td>
      <td className="p-5 text-sm text-slate-600">{lastActive}</td>
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
            onClick={() => setSelectedAction('delete')}
            className={`btn-contrast p-1.5 rounded transition-all duration-200 hover:-translate-y-0.5 ${
              selectedAction === 'delete'
                ? 'btn-contrast-danger shadow-md'
                : 'btn-contrast-neutral text-slate-600'
            }`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserPairMgmt;

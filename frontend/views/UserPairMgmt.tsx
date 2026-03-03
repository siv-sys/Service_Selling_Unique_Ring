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

  const togglePair = (id: string) => {
    setToggles(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  return (
    <>
      <Header 
        title="User & Pair Management Console" 
        subtitle="Comprehensive control over accounts and active ring couplings" 
        showProvisionButton
      />
      
      <main className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <SummaryCard 
            title="Total Active Users" 
            value="1,204" 
            status="Active Now" 
            icon={Users} 
            color="green"
          />
          <SummaryCard 
            title="Disconnected Pairs" 
            value="42" 
            status="Requires Sync" 
            icon={Link2Off} 
            color="amber"
          />
          <SummaryCard 
            title="Outdated Firmware" 
            value="18" 
            status="Action Required" 
            icon={RefreshCw} 
            color="primary"
            highlight
          />
          <SummaryCard 
            title="Suspended Accounts" 
            value="7" 
            status="Security Risk" 
            icon={ShieldAlert} 
            color="red"
          />
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border border-primary/5">
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
              <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                <Filter className="w-4 h-4" />
                Advanced Filters
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 mr-2 uppercase font-bold tracking-wider">Export:</span>
              <button className="p-2 text-slate-500 hover:bg-primary/5 rounded-lg border border-slate-100"><TableIcon className="w-4 h-4" /></button>
              <button className="p-2 text-slate-500 hover:bg-primary/5 rounded-lg border border-slate-100"><FileText className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-6 border-t border-slate-100">
            <FilterSelect label="Ring Model" options={['All Models', 'Gen 3 Pro', 'Gen 3 Lite']} />
            <FilterSelect label="OS Platform" options={['Any OS', 'iOS', 'Android']} />
            <FilterSelect label="Last Active Range" options={['Last 24 Hours', 'Last 7 Days', 'Last 30 Days']} />
            <div className="flex items-end">
              <button className="w-full bg-slate-900 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* User Table */}
        <div className="bg-white rounded-xl shadow-sm border border-primary/5 overflow-hidden">
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
              <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">Previous</button>
              <div className="flex items-center gap-1">
                <button className="w-10 h-10 bg-primary text-white rounded-lg font-bold text-sm shadow-sm">1</button>
                <button className="w-10 h-10 text-slate-600 hover:bg-primary/5 rounded-lg font-bold text-sm transition-colors">2</button>
                <button className="w-10 h-10 text-slate-600 hover:bg-primary/5 rounded-lg font-bold text-sm transition-colors">3</button>
              </div>
              <button className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">Next Page</button>
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
    <div className={`bg-white p-6 rounded-xl border ${highlight ? 'border-primary/40 ring-2 ring-primary/20' : 'border-primary/5'} shadow-sm group hover:border-primary/30 transition-all`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${colorClasses[color]}`}>
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

const UserRow = ({ id, names, pairId, tier, ring, os, osIcon: OSIcon, status, lastActive, enabled, onToggle, disabled }: any) => (
  <tr className={`hover:bg-primary/5 transition-colors group ${disabled ? 'bg-slate-50/30' : ''}`}>
    <td className="p-5">
      <button
        onClick={onToggle}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
          enabled
            ? 'bg-emerald-700 focus:ring-emerald-400'
            : 'bg-rose-700 focus:ring-rose-400'
        }`}
      >
        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enabled ? 'translate-x-4' : 'translate-x-0'}`} />
      </button>
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
        <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"><Eye className="w-4 h-4" /></button>
        <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"><BarChart2 className="w-4 h-4" /></button>
        <button className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"><Link className="w-4 h-4" /></button>
        <button className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
      </div>
    </td>
  </tr>
);

export default UserPairMgmt;

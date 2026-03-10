import React, { useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import { api } from '../lib/api';
import {
  Users,
  ShoppingBag,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

const data = [
  { name: 'MON', value: 380 },
  { name: 'TUE', value: 550 },
  { name: 'WED', value: 420 },
  { name: 'THU', value: 580 },
  { name: 'FRI', value: 380 },
  { name: 'SAT', value: 610 },
  { name: 'SUN', value: 680 },
];

type RecentAlert = {
  id: string;
  title: string;
  desc: string;
  time: string;
  color: 'red' | 'green' | 'primary';
  icon: 'alert' | 'check' | 'info';
};

type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'User';
  status: 'Active' | 'Suspended';
  lastActive: string;
};

type RingSale = {
  id: string;
  orderNo: string;
  customer: string;
  model: string;
  status: 'Sold' | 'Refunded' | 'Pending Payment';
  soldAt: string;
};

type RelationshipFollow = {
  id: string;
  pair: string;
  stage: 'New' | 'Active' | 'Anniversary' | 'Paused';
  lastInteraction: string;
  reminderAt: string;
};
type WeeklyConnectivityPoint = {
  name: string;
  value: number;
};
type PairingRequest = {
  users: [string, string];
  model: string;
  date: string;
  status: 'Pending' | 'Approved';
};
type RelationshipUserAlert = {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'new' | 'returning' | 'active' | 'anniversary';
};
type DashboardResponse = {
  stats: {
    totalUsers: number;
    totalRingsSold: number;
    activeRelationships: number;
    usersChange: string;
    ringsSoldChange: string;
    relationshipsChange: string;
    connectivityPercent: number;
    connectivityChange: string;
  };
  systemUsers: SystemUser[];
  ringSales: RingSale[];
  relationshipFollows: RelationshipFollow[];
  pairingRequests: PairingRequest[];
  relationshipUserAlerts: RelationshipUserAlert[];
  weeklyConnectivity: WeeklyConnectivityPoint[];
};
const Dashboard = () => {
  const [lastExport, setLastExport] = useState('');
  const [dashboardError, setDashboardError] = useState('');
  const [dbConnected, setDbConnected] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: -1,
    totalRingsSold: -1,
    activeRelationships: -1,
    usersChange: '+12%',
    ringsSoldChange: '+5%',
    relationshipsChange: '+2%',
    connectivityPercent: 94,
    connectivityChange: '+1.2%',
  });
  const [weeklyConnectivity, setWeeklyConnectivity] = useState<WeeklyConnectivityPoint[]>(data);
  const [activeManagePanel, setActiveManagePanel] = useState<'users' | 'rings' | 'relationships' | null>(null);
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>([
    { id: 'usr-1001', name: 'Alex Rivera', email: 'alex@smartring.com', role: 'Admin', status: 'Active', lastActive: '2 minutes ago' },
    { id: 'usr-1002', name: 'Jordan Lee', email: 'jordan@smartring.com', role: 'Manager', status: 'Active', lastActive: '8 minutes ago' },
    { id: 'usr-1003', name: 'Sam Carter', email: 'sam@smartring.com', role: 'User', status: 'Suspended', lastActive: '1 hour ago' },
    { id: 'usr-1004', name: 'Casey Morgan', email: 'casey@smartring.com', role: 'User', status: 'Active', lastActive: '4 minutes ago' }
  ]);
  const [ringSales, setRingSales] = useState<RingSale[]>([
    { id: 'sale-001', orderNo: '#R-1201', customer: 'Nika Dara', model: 'SmartRing Lover Edition', status: 'Sold', soldAt: 'Today 10:45 AM' },
    { id: 'sale-002', orderNo: '#R-1202', customer: 'Sokha Kim', model: 'Gen 3 - Rose Gold', status: 'Pending Payment', soldAt: 'Today 09:21 AM' },
    { id: 'sale-003', orderNo: '#R-1203', customer: 'Alex Jordan', model: 'Classic Silver', status: 'Sold', soldAt: 'Today 08:12 AM' },
    { id: 'sale-004', orderNo: '#R-1198', customer: 'Taylor Morgan', model: 'Midnight Black', status: 'Refunded', soldAt: 'Yesterday 07:30 PM' }
  ]);
  const [relationshipFollows, setRelationshipFollows] = useState<RelationshipFollow[]>([
    { id: 'rel-001', pair: 'Alex & Jordan', stage: 'Active', lastInteraction: '5 minutes ago', reminderAt: 'Today 8:00 PM' },
    { id: 'rel-002', pair: 'Sam & Casey', stage: 'Anniversary', lastInteraction: '30 minutes ago', reminderAt: 'Today 6:30 PM' },
    { id: 'rel-003', pair: 'Taylor & Morgan', stage: 'Paused', lastInteraction: '1 day ago', reminderAt: 'Tomorrow 9:00 AM' },
    { id: 'rel-004', pair: 'Nika & Dara', stage: 'New', lastInteraction: 'just now', reminderAt: 'Today 10:00 PM' }
  ]);

  const getTotalUsers = () =>
    dashboardStats.totalUsers >= 0 ? dashboardStats.totalUsers : systemUsers.length;

  const getTotalRingsSold = () =>
    dashboardStats.totalRingsSold >= 0
      ? dashboardStats.totalRingsSold
      : ringSales.filter((sale) => sale.status === 'Sold').length;

  const getActiveRelationships = () =>
    dashboardStats.activeRelationships >= 0
      ? dashboardStats.activeRelationships
      : relationshipFollows.filter((item) => item.stage === 'Active' || item.stage === 'Anniversary').length;

  const totalUsersValue = String(getTotalUsers());
  const totalRingsSoldValue = String(getTotalRingsSold());
  const activeRelationshipsValue = String(getActiveRelationships());

  const [pairingRequests, setPairingRequests] = useState<PairingRequest[]>([
    { users: ['Alex', 'Jordan'], model: 'SmartRing Lover Edition', date: 'Oct 24, 2023 10:45 AM', status: 'Pending' },
    { users: ['Sam', 'Casey'], model: 'SmartRing Lover Edition', date: 'Oct 24, 2023 09:12 AM', status: 'Approved' },
    { users: ['Taylor', 'Morgan'], model: 'SmartRing Lover Edition', date: 'Oct 24, 2023 08:30 AM', status: 'Pending' }
  ]);

  const [relationshipUserAlerts, setRelationshipUserAlerts] = useState<RelationshipUserAlert[]>([
    {
      id: 'rel-new-001',
      title: 'New User Registered',
      description: 'Nika & Dara created a new relationship account and completed website registration.',
      time: '2 minutes ago',
      type: 'new'
    },
    {
      id: 'rel-return-001',
      title: 'Returning User Activity',
      description: 'Alex (existing user) returned and linked relationship profile with Jordan.',
      time: '18 minutes ago',
      type: 'returning'
    },
    {
      id: 'rel-active-001',
      title: 'Active User Session',
      description: 'Sam is active now and updated ring sync settings.',
      time: 'just now',
      type: 'active'
    },
    {
      id: 'rel-anniv-001',
      title: 'Anniversary Reminder',
      description: 'Taylor & Morgan have relationship anniversary today.',
      time: 'Today 8:00 PM',
      type: 'anniversary'
    }
  ]);

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
      return error.message;
    }
    return fallback;
  };

  const applyDashboardResponse = (response: DashboardResponse) => {
    setDashboardStats((prev) => response.stats || prev);
    if (Array.isArray(response.weeklyConnectivity)) {
      setWeeklyConnectivity(response.weeklyConnectivity);
    }
    if (Array.isArray(response.systemUsers)) {
      setSystemUsers(response.systemUsers);
    }
    if (Array.isArray(response.ringSales)) {
      setRingSales(response.ringSales);
    }
    if (Array.isArray(response.relationshipFollows)) {
      setRelationshipFollows(response.relationshipFollows);
    }
    if (Array.isArray(response.pairingRequests)) {
      setPairingRequests(response.pairingRequests);
    }
    if (Array.isArray(response.relationshipUserAlerts)) {
      setRelationshipUserAlerts(response.relationshipUserAlerts);
    }
  };

  const reloadDashboardFromBackend = async () => {
    const response = await api.get<DashboardResponse>('/dashboard');
    applyDashboardResponse(response);
  };

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      try {
        const response = await api.get<DashboardResponse>('/dashboard');
        if (!isMounted) return;
        applyDashboardResponse(response);
        setDashboardError('');
        setDbConnected(true);
      } catch (_error) {
        if (!isMounted) return;
        setDashboardError('Failed to load dashboard data from backend. Showing local data.');
        setDbConnected(false);
      }
    };
    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);
  const recentAlerts = useMemo<RecentAlert[]>(() => {
    const pendingRequests = pairingRequests.filter((item) => item.status === 'Pending');
    const approvedRequests = pairingRequests.filter((item) => item.status === 'Approved');
    const activeUsers = relationshipUserAlerts.filter((item) => item.type === 'active').length;
    const anniversaryCount = relationshipUserAlerts.filter((item) => item.type === 'anniversary').length;

    return [
      pendingRequests.length
        ? {
          id: 'pending-pairing',
          title: 'Pending Pairing Request',
          desc: `${pendingRequests[0].users.join(' & ')} are waiting for approval.`,
          time: pendingRequests[0].date,
          color: 'red',
          icon: 'alert'
        }
        : null,
      approvedRequests.length
        ? {
          id: 'approved-pairing',
          title: 'Approved Pairings',
          desc: `${approvedRequests.length} pairing request(s) approved successfully.`,
          time: 'Updated from latest request list',
          color: 'green',
          icon: 'check'
        }
        : null,
      {
        id: 'active-users',
        title: 'User Active Monitoring',
        desc: `${activeUsers} user(s) active now with latest activity time tracked.`,
        time: relationshipUserAlerts.find((item) => item.type === 'active')?.time || 'just now',
        color: 'primary',
        icon: 'info'
      },
      {
        id: 'anniversary-alert',
        title: 'Anniversary Alert',
        desc: `${anniversaryCount} relationship anniversary reminder(s) today.`,
        time: relationshipUserAlerts.find((item) => item.type === 'anniversary')?.time || 'today',
        color: 'primary',
        icon: 'info'
      }
    ].filter(Boolean) as RecentAlert[];
  }, [pairingRequests, relationshipUserAlerts]);

  const getTimestamp = () => new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await api.patch<{ user: SystemUser }>(`/dashboard/users/${userId}/status`, {});
      await reloadDashboardFromBackend();
      setDashboardError('');
    } catch (error) {
      setDashboardError(getErrorMessage(error, 'Failed to update user status in database.'));
    }
  };

  const handleChangeUserRole = async (userId: string) => {
    try {
      await api.patch<{ user: SystemUser }>(`/dashboard/users/${userId}/role`, {});
      await reloadDashboardFromBackend();
      setDashboardError('');
    } catch (error) {
      setDashboardError(getErrorMessage(error, 'Failed to update user role in database.'));
    }
  };

  const handleCycleSaleStatus = async (saleId: string) => {
    try {
      await api.patch<{ ring: RingSale }>(`/dashboard/rings/${saleId}/status`, {});
      await reloadDashboardFromBackend();
      setDashboardError('');
    } catch (error) {
      setDashboardError(getErrorMessage(error, 'Failed to update ring status in database.'));
    }
  };

  const handleCycleRelationshipStage = async (relationId: string) => {
    try {
      await api.patch<{ relationship: RelationshipFollow }>(`/dashboard/relationships/${relationId}/stage`, {});
      await reloadDashboardFromBackend();
      setDashboardError('');
    } catch (error) {
      setDashboardError(getErrorMessage(error, 'Failed to update relationship stage in database.'));
    }
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    const rows = [
      ['Dashboard Stats', '', ''],
      ['Metric', 'Value', 'Change'],
      ['Total Users', '12,450', '+12%'],
      ['Total Rings Sold', '8,201', '+5%'],
      ['Active Relationships', '4,105', '+2%'],
      [],
      ['Latest Pairing Requests', '', '', ''],
      ['Users', 'Device Model', 'Request Date', 'Status'],
      ...pairingRequests.map((item) => [item.users.join(' & '), item.model, item.date, item.status]),
      [],
      ['Recent Alerts', '', ''],
      ['Title', 'Detail', 'Time'],
      ...recentAlerts.map((item) => [item.title, item.desc, item.time])
    ];

    const csvContent = rows.map((line) => line.join(',')).join('\n');
    const fileName = `dashboard-export-${getTimestamp()}.csv`;
    downloadBlob(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), fileName);
    setLastExport(fileName);
  };

  const handleExportPdf = () => {
    const popup = window.open('', '_blank', 'width=1100,height=700');
    if (!popup) return;

    const pairingHtml = pairingRequests
      .map((item) => `<tr><td>${item.users.join(' & ')}</td><td>${item.model}</td><td>${item.date}</td><td>${item.status}</td></tr>`)
      .join('');
    const alertsHtml = recentAlerts
      .map((item) => `<tr><td>${item.title}</td><td>${item.desc}</td><td>${item.time}</td></tr>`)
      .join('');

    popup.document.write(`
      <html>
      <head>
        <title>Dashboard Export</title>
        <style>
          body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}
          h2,h3{margin:0 0 8px}
          p{margin:0 0 16px;color:#475569}
          table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:18px}
          th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}
          th{background:#fdf2f8}
        </style>
      </head>
      <body>
        <h2>Dashboard Export</h2>
        <p>Generated: ${new Date().toLocaleString()}</p>
        <h3>Stats</h3>
        <table><thead><tr><th>Metric</th><th>Value</th><th>Change</th></tr></thead><tbody><tr><td>Total Users</td><td>12,450</td><td>+12%</td></tr><tr><td>Total Rings Sold</td><td>8,201</td><td>+5%</td></tr><tr><td>Active Relationships</td><td>4,105</td><td>+2%</td></tr></tbody></table>
        <h3>Latest Pairing Requests</h3>
        <table><thead><tr><th>Users</th><th>Model</th><th>Date</th><th>Status</th></tr></thead><tbody>${pairingHtml}</tbody></table>
        <h3>Recent Alerts</h3>
        <table><thead><tr><th>Title</th><th>Detail</th><th>Time</th></tr></thead><tbody>${alertsHtml}</tbody></table>
      </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    setTimeout(() => popup.print(), 220);
    setLastExport(`dashboard-export-${getTimestamp()}.pdf`);
  };

  return (
    <>
      <Header
        title="Dashboard Overview"
        subtitle={`Platform performance and key metrics at a glance ${dbConnected ? '🟢 Database Connected' : '🔴 Database Offline'}`}
        onExportExcel={handleExportExcel}
        onExportPdf={handleExportPdf}
        notifications={relationshipUserAlerts}
        showExportButton
      />

      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {dashboardError && <p className="text-xs font-semibold text-rose-600">{dashboardError}</p>}
        {lastExport && <p className="text-xs font-semibold text-slate-600">Last export: {lastExport}</p>}
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Total Users"
            value={totalUsersValue}
            change={dashboardStats.usersChange}
            icon={Users}
            color="primary"
            onClick={() => setActiveManagePanel((prev) => (prev === 'users' ? null : 'users'))}
            active={activeManagePanel === 'users'}
            subtext="Click to manage system users"
          />
          <StatCard
            title="Total Rings Sold"
            value={totalRingsSoldValue}
            change={dashboardStats.ringsSoldChange}
            icon={ShoppingBag}
            color="primary"
            onClick={() => setActiveManagePanel((prev) => (prev === 'rings' ? null : 'rings'))}
            active={activeManagePanel === 'rings'}
            subtext="Click to follow ring sales"
          />
          <StatCard
            title="Active Relationships"
            value={activeRelationshipsValue}
            change={dashboardStats.relationshipsChange}
            icon={Heart}
            color="primary"
            onClick={() => setActiveManagePanel((prev) => (prev === 'relationships' ? null : 'relationships'))}
            active={activeManagePanel === 'relationships'}
            subtext="Click to follow relationships"
          />
        </div>

        {activeManagePanel === 'users' && (
          <div className="bg-white rounded-xl border border-pink-300 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">System User Management</h2>
                <p className="text-xs text-slate-500">Manage user role and status from Total Users feature.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveManagePanel(null)}
                className="text-xs font-bold px-3 py-1.5 rounded border border-pink-300 text-pink-800 hover:bg-pink-100 active:bg-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
              >
                Close
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-pink-50 text-pink-800 text-[11px] font-bold uppercase tracking-wider border-b border-pink-200">
                  <tr>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Role</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Active</th>
                    <th className="px-6 py-3 text-right">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {systemUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900">{user.name}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{user.email}</td>
                      <td className="px-6 py-3">
                        <button
                          type="button"
                          onClick={() => handleChangeUserRole(user.id)}
                          className="text-[11px] font-bold px-2.5 py-1 rounded border border-pink-200 text-pink-700 hover:bg-pink-50"
                        >
                          {user.role}
                        </button>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">{user.lastActive}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(user.id)}
                          className={`text-xs font-bold px-3 py-1.5 rounded border ${user.status === 'Active'
                            ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                            : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                            }`}
                        >
                          {user.status === 'Active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeManagePanel === 'rings' && (
          <div className="bg-white rounded-xl border border-pink-300 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Total Rings Sold - Live Follow</h2>
                <p className="text-xs text-slate-500">Follow ring sales updates here without leaving this page.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveManagePanel(null)}
                className="text-xs font-bold px-3 py-1.5 rounded border border-pink-300 text-pink-800 hover:bg-pink-100 active:bg-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
              >
                Close
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-pink-50 text-pink-800 text-[11px] font-bold uppercase tracking-wider border-b border-pink-200">
                  <tr>
                    <th className="px-6 py-3">Order</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Ring Model</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3 text-right">Follow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {ringSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900">{sale.orderNo}</td>
                      <td className="px-6 py-3 text-sm text-slate-700">{sale.customer}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{sale.model}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${sale.status === 'Sold'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : sale.status === 'Refunded'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-500">{sale.soldAt}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleCycleSaleStatus(sale.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded border border-pink-300 text-pink-800 hover:bg-pink-100 active:bg-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                        >
                          Update Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeManagePanel === 'relationships' && (
          <div className="bg-white rounded-xl border border-pink-300 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-pink-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900">Active Relationships - Live Follow</h2>
                <p className="text-xs text-slate-500">Follow relationship activity on this page without switching routes.</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveManagePanel(null)}
                className="text-xs font-bold px-3 py-1.5 rounded border border-pink-300 text-pink-800 hover:bg-pink-100 active:bg-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
              >
                Close
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-pink-50 text-pink-800 text-[11px] font-bold uppercase tracking-wider border-b border-pink-200">
                  <tr>
                    <th className="px-6 py-3">Pair</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3">Last Interaction</th>
                    <th className="px-6 py-3">Reminder</th>
                    <th className="px-6 py-3 text-right">Follow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {relationshipFollows.map((relation) => (
                    <tr key={relation.id} className="hover:bg-pink-50/30 transition-colors">
                      <td className="px-6 py-3 text-sm font-semibold text-slate-900">{relation.pair}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${relation.stage === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : relation.stage === 'Anniversary'
                              ? 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
                              : relation.stage === 'Paused'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}
                        >
                          {relation.stage}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-600">{relation.lastInteraction}</td>
                      <td className="px-6 py-3 text-sm text-slate-500">{relation.reminderAt}</td>
                      <td className="px-6 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleCycleRelationshipStage(relation.id)}
                          className="text-xs font-bold px-3 py-1.5 rounded border border-pink-300 text-pink-800 hover:bg-pink-100 active:bg-pink-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-300"
                        >
                          Update Stage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-pink-300 shadow-sm">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-pink-200">
              <div>
                <h2 className="text-lg font-bold">Weekly Ring Connectivity</h2>
                <p className="text-sm text-slate-500">Website/App traffic performance</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">{dashboardStats.connectivityPercent}%</span>
                  <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">{dashboardStats.connectivityChange}</span>
                </div>
                <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded text-xs font-bold shadow-sm border border-pink-700 transition-colors">
                  Actions
                </button>
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyConnectivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" />
                  <XAxis
                    dataKey="name"
                    axisLine={{ stroke: '#f9a8d4' }}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={{ stroke: '#f9a8d4' }}
                    tickLine={false}
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {weeklyConnectivity.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 3 ? '#ec1380' : '#ec1380cc'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex justify-center gap-8">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-primary"></span>
                <span className="text-xs font-medium text-slate-600">Website/App Traffic</span>
              </div>
            </div>
          </div>

          {/* Alerts Section */}
          <div className="bg-white p-6 rounded-xl border border-pink-300 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-pink-200">
              <h2 className="text-lg font-bold">Recent Alerts</h2>
              <button className="text-pink-700 text-xs font-bold hover:text-pink-800 hover:underline">View All</button>
            </div>
            <div className="space-y-4 flex-1">
              {recentAlerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  icon={alert.icon === 'alert' ? AlertCircle : alert.icon === 'check' ? CheckCircle2 : Info}
                  title={alert.title}
                  desc={alert.desc}
                  time={alert.time}
                  color={alert.color}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl border border-pink-300 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-pink-300 flex items-center justify-between">
            <h2 className="font-bold">Latest Pairing Requests</h2>
            <button className="bg-pink-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold border border-pink-700 hover:bg-pink-700 transition-colors">
              Manage Queue
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-pink-50 text-pink-800 text-[11px] font-bold uppercase tracking-wider border-b border-pink-300">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Device Model</th>
                  <th className="px-6 py-3">Request Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pairingRequests.map((item, index) => (
                  <PairingRow
                    key={`${item.users.join('-')}-${index}`}
                    users={item.users}
                    model={item.model}
                    date={item.date}
                    status={item.status}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

const StatCard = ({ title, value, change, icon: Icon, color, onClick, active, subtext }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={`bg-white p-6 rounded-xl border border-pink-300 shadow-sm flex flex-col gap-1 text-left ${active ? 'ring-2 ring-pink-300' : ''}`}
  >
    <div className="flex justify-between items-start">
      <span className="text-slate-500 text-sm font-medium">{title}</span>
      <div className="p-2 bg-pink-100 text-pink-700 rounded-lg border border-pink-200">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-end gap-2 mt-2">
      <h3 className="text-3xl font-bold">{value}</h3>
      <span className="text-green-600 text-sm font-bold flex items-center mb-1">
        <TrendingUp className="w-4 h-4 mr-1" /> {change}
      </span>
    </div>
    {subtext && <p className="text-[11px] text-slate-500">{subtext}</p>}
  </button>
);

const AlertItem = ({ icon: Icon, title, desc, time, color }: any) => {
  const colorClasses: any = {
    red: "border-rose-400 bg-rose-50 ring-1 ring-rose-100",
    green: "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-100",
    primary: "border-pink-400 bg-pink-50 ring-1 ring-pink-100"
  };
  const iconBgClasses: any = {
    red: "bg-rose-100 text-rose-700",
    green: "bg-emerald-100 text-emerald-700",
    primary: "bg-pink-100 text-pink-700"
  };
  const titleColorClasses: any = {
    red: "text-rose-900",
    green: "text-emerald-900",
    primary: "text-pink-900"
  };

  return (
    <div className={`flex gap-4 items-start p-3 rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className={`p-1 rounded ${iconBgClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className={`text-xs font-bold ${titleColorClasses[color]}`}>{title}</p>
        <p className="text-[11px] text-slate-500">{desc}</p>
        <span className="text-[10px] text-slate-400 font-medium">{time}</span>
      </div>
    </div>
  );
};

const PairingRow = ({ users, model, date, status }: any) => (
  <tr className="hover:bg-primary/5 transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2 overflow-hidden">
          <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white bg-cover" style={{ backgroundImage: `url(https://picsum.photos/seed/${users[0]}/100)` }}></div>
          <div className="h-8 w-8 rounded-full bg-slate-200 border-2 border-white bg-cover" style={{ backgroundImage: `url(https://picsum.photos/seed/${users[1]}/100)` }}></div>
        </div>
        <span className="text-sm font-medium">{users[0]} & {users[1]}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-sm">{model}</td>
    <td className="px-6 py-4 text-sm text-slate-500">{date}</td>
    <td className="px-6 py-4">
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${status === 'Pending'
        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
        : 'bg-green-50 text-green-700 border-green-200'
        }`}>
        {status}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <button className="text-pink-700 hover:text-pink-800 font-bold text-sm border border-pink-200 px-3 py-1 rounded-md hover:bg-pink-50 transition-colors">
        Review
      </button>
    </td>
  </tr>
);

export default Dashboard;

import React from 'react';
import Header from '../components/Header';
import { 
  Users, 
  ShoppingBag, 
  Heart, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  MoreHorizontal
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
  { name: 'MON', value: 480 },
  { name: 'TUE', value: 550 },
  { name: 'WED', value: 420 },
  { name: 'THU', value: 620 },
  { name: 'FRI', value: 380 },
  { name: 'SAT', value: 450 },
  { name: 'SUN', value: 300 },
];

const Dashboard = () => {
  return (
    <>
      <Header 
        title="Dashboard Overview" 
        subtitle="Platform performance and key metrics at a glance" 
        showExportButton
      />
      
      <main className="flex-1 overflow-y-auto p-8 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Users" 
            value="12,450" 
            change="+12%" 
            icon={Users} 
            color="primary"
          />
          <StatCard 
            title="Total Rings Sold" 
            value="8,201" 
            change="+5%" 
            icon={ShoppingBag} 
            color="primary"
          />
          <StatCard 
            title="Active Relationships" 
            value="4,105" 
            change="+2%" 
            icon={Heart} 
            color="primary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-primary/10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold">Weekly Ring Connectivity</h2>
                <p className="text-sm text-slate-500">Website/App traffic performance</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-primary">94%</span>
                  <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full">+1.2%</span>
                </div>
                <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded text-xs font-bold shadow-sm transition-colors">
                  Actions
                </button>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 500, fill: '#94a3b8' }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {data.map((entry, index) => (
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
          <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Recent Alerts</h2>
              <button className="text-primary text-xs font-bold hover:underline">View All</button>
            </div>
            <div className="space-y-4 flex-1">
              <AlertItem 
                icon={AlertCircle} 
                title="Connectivity Drop" 
                desc="Node #452 reporting 30% latency increase" 
                time="2 mins ago" 
                color="red"
              />
              <AlertItem 
                icon={CheckCircle2} 
                title="Firmware Update" 
                desc="V2.4 Successfully deployed to 1,200 devices" 
                time="1 hour ago" 
                color="green"
              />
              <AlertItem 
                icon={Info} 
                title="New Pairing Request" 
                desc="User ID: #8892 waiting for approval" 
                time="3 hours ago" 
                color="primary"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl border border-primary/10 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-primary/10 flex items-center justify-between">
            <h2 className="font-bold">Latest Pairing Requests</h2>
            <button className="bg-primary/10 text-primary px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/20 transition-colors">
              Manage Queue
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Device Model</th>
                  <th className="px-6 py-3">Request Date</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                <PairingRow 
                  users={['Alex', 'Jordan']} 
                  model="SmartRing Lover Edition" 
                  date="Oct 24, 2023 10:45 AM" 
                  status="Pending" 
                />
                <PairingRow 
                  users={['Sam', 'Casey']} 
                  model="SmartRing Lover Edition" 
                  date="Oct 24, 2023 09:12 AM" 
                  status="Approved" 
                />
                <PairingRow 
                  users={['Taylor', 'Morgan']} 
                  model="SmartRing Lover Edition" 
                  date="Oct 24, 2023 08:30 AM" 
                  status="Pending" 
                />
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </>
  );
};

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl border border-primary/10 shadow-sm flex flex-col gap-1">
    <div className="flex justify-between items-start">
      <span className="text-slate-500 text-sm font-medium">{title}</span>
      <div className="p-2 bg-primary/10 text-primary rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div className="flex items-end gap-2 mt-2">
      <h3 className="text-3xl font-bold">{value}</h3>
      <span className="text-green-600 text-sm font-bold flex items-center mb-1">
        <TrendingUp className="w-4 h-4 mr-1" /> {change}
      </span>
    </div>
  </div>
);

const AlertItem = ({ icon: Icon, title, desc, time, color }: any) => {
  const colorClasses: any = {
    red: "border-red-500 bg-red-50/50",
    green: "border-green-500 bg-green-50/50",
    primary: "border-primary bg-primary/5"
  };
  const iconBgClasses: any = {
    red: "bg-red-100 text-red-600",
    green: "bg-green-100 text-green-600",
    primary: "bg-primary/10 text-primary"
  };

  return (
    <div className={`flex gap-4 items-start p-3 rounded-lg border-l-4 ${colorClasses[color]}`}>
      <div className={`p-1 rounded ${iconBgClasses[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-xs font-bold">{title}</p>
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
      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
        status === 'Pending' 
          ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
          : 'bg-green-50 text-green-700 border-green-200'
      }`}>
        {status}
      </span>
    </td>
    <td className="px-6 py-4 text-right">
      <button className="text-primary hover:text-primary/70 font-bold text-sm">Review</button>
    </td>
  </tr>
);

export default Dashboard;

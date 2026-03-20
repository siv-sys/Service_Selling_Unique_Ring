import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

type AlertTone = 'success' | 'muted' | 'warning';

interface DashboardStat {
  value: number;
  trend: string;
  helper: string;
}

interface TrafficPoint {
  day: string;
  value: number;
}

interface AlertItem {
  title: string;
  detail: string;
  time: string;
  tone: AlertTone;
}

interface PairRequest {
  pairName: string;
  ringModel: string;
  requestedAt: string;
  status: 'Pending' | 'Approved' | 'Review';
}

interface DashboardData {
  totalUsers: DashboardStat;
  totalRingsSold: DashboardStat;
  activeRelationships: DashboardStat;
  connectivity: {
    score: number;
    trend: string;
    traffic: TrafficPoint[];
  };
  alerts: AlertItem[];
  pairRequests: PairRequest[];
}

const LOCAL_DASHBOARD_DATA: DashboardData = {
  totalUsers: {
    value: 0,
    trend: '+12%',
    helper: 'Click to manage system users',
  },
  totalRingsSold: {
    value: 2,
    trend: '+5%',
    helper: 'Click to follow ring sales',
  },
  activeRelationships: {
    value: 2,
    trend: '+2%',
    helper: 'Click to follow relationships',
  },
  connectivity: {
    score: 94,
    trend: '+1.2%',
    traffic: [
      { day: 'Mon', value: 380 },
      { day: 'Tue', value: 560 },
      { day: 'Wed', value: 420 },
      { day: 'Thu', value: 590 },
      { day: 'Fri', value: 380 },
      { day: 'Sat', value: 620 },
      { day: 'Sun', value: 690 },
    ],
  },
  alerts: [
    {
      title: 'Active Ring Pairs',
      detail: '3 paired couples with rings purchased.',
      time: 'Updated from latest pair data',
      tone: 'success',
    },
    {
      title: 'User Active Monitoring',
      detail: '1 user(s) active now with latest activity time tracked.',
      time: 'Just now',
      tone: 'muted',
    },
    {
      title: 'Anniversary Alert',
      detail: "1 relationship anniversary reminder(s) today.",
      time: 'Today 8:00 PM',
      tone: 'warning',
    },
  ],
  pairRequests: [
    {
      pairName: 'Noah & Emma',
      ringModel: 'Aster Pair Gold',
      requestedAt: '09:18 AM',
      status: 'Pending',
    },
    {
      pairName: 'Liam & Mia',
      ringModel: 'Velvet Light Silver',
      requestedAt: '10:42 AM',
      status: 'Review',
    },
    {
      pairName: 'Ethan & Ava',
      ringModel: 'Solemn Rose Duo',
      requestedAt: '12:05 PM',
      status: 'Approved',
    },
  ],
};

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function normalizeDashboardResponse(response: unknown): DashboardData {
  if (!response || typeof response !== 'object') {
    return LOCAL_DASHBOARD_DATA;
  }

  const raw = response as Record<string, unknown>;
  const totals = (raw.totals || raw.metrics || {}) as Record<string, unknown>;
  const connectivity = (raw.connectivity || {}) as Record<string, unknown>;

  const trafficSource = Array.isArray(raw.traffic)
    ? raw.traffic
    : Array.isArray(connectivity.traffic)
    ? connectivity.traffic
    : LOCAL_DASHBOARD_DATA.connectivity.traffic;
  const alertsSource = Array.isArray(raw.alerts) ? raw.alerts : LOCAL_DASHBOARD_DATA.alerts;
  const pairRequestsSource = Array.isArray(raw.pairRequests)
    ? raw.pairRequests
    : LOCAL_DASHBOARD_DATA.pairRequests;

  const traffic = trafficSource
    .map((item, index) => {
      const source = item as Record<string, unknown>;
      const fallbackPoint = LOCAL_DASHBOARD_DATA.connectivity.traffic[index];
      return {
        day: toString(source.day, fallbackPoint?.day || `Day ${index + 1}`),
        value: toNumber(source.value, fallbackPoint?.value || 0),
      };
    })
    .slice(0, 7);

  const alerts = alertsSource
    .map((item, index) => {
      const source = item as Record<string, unknown>;
      const fallbackAlert = LOCAL_DASHBOARD_DATA.alerts[index];
      const toneCandidate = toString(source.tone, fallbackAlert?.tone || 'muted');
      const tone: AlertTone =
        toneCandidate === 'success' || toneCandidate === 'warning' ? toneCandidate : 'muted';
      return {
        title: toString(source.title, fallbackAlert?.title || 'System Alert'),
        detail: toString(source.detail, fallbackAlert?.detail || ''),
        time: toString(source.time, fallbackAlert?.time || 'Now'),
        tone,
      };
    })
    .slice(0, 4);

  const pairRequests = pairRequestsSource
    .map((item, index) => {
      const source = item as Record<string, unknown>;
      const fallbackRequest = LOCAL_DASHBOARD_DATA.pairRequests[index];
      const statusCandidate = toString(source.status, fallbackRequest?.status || 'Pending');
      const status: PairRequest['status'] =
        statusCandidate === 'Approved' || statusCandidate === 'Review'
          ? statusCandidate
          : 'Pending';
      return {
        pairName: toString(source.pairName, fallbackRequest?.pairName || 'Unknown Pair'),
        ringModel: toString(source.ringModel, fallbackRequest?.ringModel || 'Unknown Model'),
        requestedAt: toString(source.requestedAt, fallbackRequest?.requestedAt || '--:--'),
        status,
      };
    })
    .slice(0, 5);

  return {
    totalUsers: {
      value: toNumber(
        totals.totalUsers || raw.totalUsers,
        LOCAL_DASHBOARD_DATA.totalUsers.value,
      ),
      trend: toString(
        totals.totalUsersTrend || raw.totalUsersTrend,
        LOCAL_DASHBOARD_DATA.totalUsers.trend,
      ),
      helper: toString(raw.totalUsersHelper, LOCAL_DASHBOARD_DATA.totalUsers.helper),
    },
    totalRingsSold: {
      value: toNumber(
        totals.totalRingsSold || raw.totalRingsSold,
        LOCAL_DASHBOARD_DATA.totalRingsSold.value,
      ),
      trend: toString(
        totals.totalRingsSoldTrend || raw.totalRingsSoldTrend,
        LOCAL_DASHBOARD_DATA.totalRingsSold.trend,
      ),
      helper: toString(raw.totalRingsSoldHelper, LOCAL_DASHBOARD_DATA.totalRingsSold.helper),
    },
    activeRelationships: {
      value: toNumber(
        totals.activeRelationships || raw.activeRelationships,
        LOCAL_DASHBOARD_DATA.activeRelationships.value,
      ),
      trend: toString(
        totals.activeRelationshipsTrend || raw.activeRelationshipsTrend,
        LOCAL_DASHBOARD_DATA.activeRelationships.trend,
      ),
      helper: toString(raw.activeRelationshipsHelper, LOCAL_DASHBOARD_DATA.activeRelationships.helper),
    },
    connectivity: {
      score: toNumber(
        connectivity.score || raw.connectivityScore,
        LOCAL_DASHBOARD_DATA.connectivity.score,
      ),
      trend: toString(
        connectivity.trend || raw.connectivityTrend,
        LOCAL_DASHBOARD_DATA.connectivity.trend,
      ),
      traffic: traffic.length > 0 ? traffic : LOCAL_DASHBOARD_DATA.connectivity.traffic,
    },
    alerts: alerts.length > 0 ? alerts : LOCAL_DASHBOARD_DATA.alerts,
    pairRequests: pairRequests.length > 0 ? pairRequests : LOCAL_DASHBOARD_DATA.pairRequests,
  };
}

const DashboardView: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>(LOCAL_DASHBOARD_DATA);
  const [usingFallbackData, setUsingFallbackData] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      try {
        const response = await api.get<unknown>('/dashboard/overview');
        if (!isMounted) {
          return;
        }
        setDashboardData(normalizeDashboardResponse(response));
        setUsingFallbackData(false);
      } catch (error) {
        console.warn('Dashboard API unavailable, using local fallback data.', error);
        if (!isMounted) {
          return;
        }
        setDashboardData(LOCAL_DASHBOARD_DATA);
        setUsingFallbackData(true);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const trafficPeak = useMemo(() => {
    const max = Math.max(...dashboardData.connectivity.traffic.map((item) => item.value), 0);
    return max || 1;
  }, [dashboardData.connectivity.traffic]);

  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-logo">RA</div>
          <div>
            <h2>RingAdmin</h2>
            <p>Console</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button className="admin-nav-item is-active">
            <span className="admin-nav-icon">D</span>
            Dashboard
          </button>
          <button className="admin-nav-item">
            <span className="admin-nav-icon">U</span>
            User &amp; Pair Management
          </button>
          <button className="admin-nav-item">
            <span className="admin-nav-icon">R</span>
            Ring Inventory
          </button>
          <button className="admin-nav-item">
            <span className="admin-nav-icon">C</span>
            Catalog Seed
          </button>
          <button className="admin-nav-item">
            <span className="admin-nav-icon">S</span>
            Settings
          </button>
        </nav>

        <div className="admin-sidebar-bottom">
          <button className="admin-logout-btn">Logout</button>
          <div className="admin-mini-profile">
            <img
              src="https://picsum.photos/seed/ringadmin/88/88"
              alt="Admin user avatar"
              referrerPolicy="no-referrer"
            />
            <div>
              <strong>Alex Rivera</strong>
              <span>System Admin</span>
            </div>
          </div>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Dashboard Overview</h1>
            <p>
              Platform performance and key metrics at a glance
              <span className="admin-db-pill">
                <i aria-hidden /> Database Offline
              </span>
            </p>
          </div>

          <div className="admin-topbar-actions">
            <label className="admin-search">
              <input type="text" placeholder="Search..." />
            </label>
            <button className="admin-icon-btn" aria-label="Notifications">
              N
            </button>
            <button className="admin-export-btn">Export</button>
            <img
              className="admin-avatar"
              src="https://picsum.photos/seed/ring-admin-avatar/120/120"
              alt="Current admin avatar"
              referrerPolicy="no-referrer"
            />
          </div>
        </header>

        {(usingFallbackData || isLoading) && (
          <p className="admin-banner-error">
            Failed to load dashboard data from backend. Showing local data.
          </p>
        )}

        <section className="admin-kpi-grid">
          <article className="admin-kpi-card">
            <header>
              <h3>Total Users</h3>
              <span className="admin-kpi-icon">US</span>
            </header>
            <strong>{dashboardData.totalUsers.value}</strong>
            <p>
              <span>{dashboardData.totalUsers.trend}</span>
            </p>
            <small>{dashboardData.totalUsers.helper}</small>
          </article>

          <article className="admin-kpi-card">
            <header>
              <h3>Total Rings Sold</h3>
              <span className="admin-kpi-icon">RS</span>
            </header>
            <strong>{dashboardData.totalRingsSold.value}</strong>
            <p>
              <span>{dashboardData.totalRingsSold.trend}</span>
            </p>
            <small>{dashboardData.totalRingsSold.helper}</small>
          </article>

          <article className="admin-kpi-card">
            <header>
              <h3>Active Relationships</h3>
              <span className="admin-kpi-icon">AR</span>
            </header>
            <strong>{dashboardData.activeRelationships.value}</strong>
            <p>
              <span>{dashboardData.activeRelationships.trend}</span>
            </p>
            <small>{dashboardData.activeRelationships.helper}</small>
          </article>
        </section>

        <section className="admin-dashboard-grid">
          <article className="admin-panel admin-traffic-panel">
            <header className="admin-panel-head">
              <div>
                <h2>Weekly Ring Connectivity</h2>
                <p>Website/App traffic performance</p>
              </div>
              <div className="admin-connectivity-score">
                <strong>{dashboardData.connectivity.score}%</strong>
                <span>{dashboardData.connectivity.trend}</span>
                <button>Actions</button>
              </div>
            </header>

            <div className="admin-chart-area">
              <div className="admin-chart-grid">
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="admin-bars">
                {dashboardData.connectivity.traffic.map((point) => (
                  <div className="admin-bar-item" key={point.day}>
                    <div
                      className="admin-bar-fill"
                      style={{ height: `${Math.max((point.value / trafficPeak) * 100, 8)}%` }}
                      title={`${point.day}: ${point.value}`}
                    />
                    <label>{point.day}</label>
                  </div>
                ))}
              </div>
            </div>
            <footer className="admin-traffic-legend">
              <span />
              Website/App Traffic
            </footer>
          </article>

          <aside className="admin-panel admin-alerts-panel">
            <header className="admin-panel-head">
              <h2>Recent Alerts</h2>
              <a href="#">View All</a>
            </header>

            <div className="admin-alert-list">
              {dashboardData.alerts.map((alert) => (
                <article key={`${alert.title}-${alert.time}`} className={`admin-alert-item tone-${alert.tone}`}>
                  <h3>{alert.title}</h3>
                  <p>{alert.detail}</p>
                  <small>{alert.time}</small>
                </article>
              ))}
            </div>
          </aside>
        </section>

        <section className="admin-panel admin-requests-panel">
          <header className="admin-panel-head">
            <h2>Latest Pairing Requests</h2>
            <button>Manage Queue</button>
          </header>

          <div className="admin-request-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Couple</th>
                  <th>Ring Model</th>
                  <th>Requested</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.pairRequests.map((request) => (
                  <tr key={`${request.pairName}-${request.requestedAt}`}>
                    <td>{request.pairName}</td>
                    <td>{request.ringModel}</td>
                    <td>{request.requestedAt}</td>
                    <td>
                      <span className={`admin-status-chip status-${request.status.toLowerCase()}`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
};

export default DashboardView;

import React from 'react';
import { api } from '../lib/api';

interface Partner {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
  role: 'PARTNER_A' | 'PARTNER_B';
}

interface ConnectionData {
  pairId: number;
  pairCode: string;
  status: string;
  establishedAt: string;
  partners: Partner[];
}

const SharedConnectionPage: React.FC = () => {
  const [connection, setConnection] = React.useState<ConnectionData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchConnectionData();
  }, []);

  const fetchConnectionData = async () => {
    try {
      const result: any = await api.get('/pairs/my-connection');
      if (result.success && result.connection) {
        setConnection(result.connection);
      }
    } catch (error) {
      console.error('Error fetching connection data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        Loading connection data...
      </div>
    );
  }

  if (!connection || connection.partners.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💔</div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          No Connection Found
        </h2>
        <p style={{ color: '#9ca3af', marginBottom: '24px' }}>
          You haven't established a connection yet.
        </p>
        <button
          onClick={() => window.location.href = '/relationship'}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Find Your Partner →
        </button>
      </div>
    );
  }

  const startDate = new Date(connection.establishedAt);
  const daysTogether = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        padding: '40px',
        backgroundColor: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💑</div>
        <h1 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '8px' }}>
          We're Connected!
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9 }}>
          Together since {startDate.toLocaleDateString()}
        </p>
      </div>

      {/* Partners Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '24px',
        marginBottom: '40px'
      }}>
        {connection.partners.map((partner) => (
          <div
            key={partner.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              textAlign: 'center'
            }}
          >
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              backgroundColor: partner.avatar ? '#e5e7eb' : '#ec4899',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '48px'
            }}>
              {partner.avatar ? (
                <img 
                  src={partner.avatar} 
                  alt={partner.name || partner.email}
                  style={{ width: '100%', height: '100%', borderRadius: '50%' }} 
                />
              ) : (
                '👤'
              )}
            </div>
            
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              {partner.name || partner.email}
            </h2>
            <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
              {partner.email}
            </p>
            <div style={{
              display: 'inline-block',
              padding: '8px 16px',
              backgroundColor: partner.role === 'PARTNER_A' ? '#ec4899' : '#f472b6',
              color: 'white',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: 600
            }}>
              {partner.role === 'PARTNER_A' ? 'Initiator' : 'Partner'}
            </div>
          </div>
        ))}
      </div>

      {/* Connection Stats */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '40px'
      }}>
        <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', textAlign: 'center' }}>
          Our Journey Together
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#ec4899' }}>
              {daysTogether}
            </div>
            <div style={{ color: '#9ca3af', marginTop: '8px' }}>
              Days Together
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>
              ❤️
            </div>
            <div style={{ color: '#9ca3af', marginTop: '8px' }}>
              Connected
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#f59e0b' }}>
              ✨
            </div>
            <div style={{ color: '#9ca3af', marginTop: '8px' }}>
              Full Access
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        <button
          onClick={() => window.location.href = '/couple-shop'}
          style={{
            padding: '16px',
            backgroundColor: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px'
          }}
        >
          🛍️ Visit Couple Shop
        </button>
        
        <button
          onClick={() => window.location.href = '/memories'}
          style={{
            padding: '16px',
            backgroundColor: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px'
          }}
        >
          📸 Our Memories
        </button>
        
        <button
          onClick={() => window.location.href = '/relationship'}
          style={{
            padding: '16px',
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '16px'
          }}
        >
          💫 Manage Connection
        </button>
      </div>
    </div>
  );
};

export default SharedConnectionPage;

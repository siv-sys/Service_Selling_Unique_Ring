import React from 'react';
import { api } from '../lib/api';

interface Invitation {
  id: number;
  type: 'sent' | 'received';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
  createdAt: string;
  respondedAt: string | null;
  user: {
    id: number;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

const ConnectionRequestsView: React.FC = () => {
  const [invitations, setInvitations] = React.useState<{ sent: Invitation[]; received: Invitation[] } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'received' | 'sent'>('received');

  React.useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const result: any = await api.get('/pair-invitations/my-invitations');
      if (result.success) {
        setInvitations(result.invitations);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId: number) => {
    try {
      const result: any = await api.post(`/pair-invitations/${invitationId}/accept`);
      if (result.success) {
        alert('✅ Connection established! Redirecting...');
        fetchInvitations(); // Refresh list
        // Redirect to couple profile or shared page
        window.location.href = '/couple-profile';
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to accept invitation');
    }
  };

  const handleReject = async (invitationId: number) => {
    try {
      const result: any = await api.post(`/pair-invitations/${invitationId}/reject`);
      if (result.success) {
        alert('Invitation rejected');
        fetchInvitations(); // Refresh list
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to reject invitation');
    }
  };

  const handleCancel = async (invitationId: number) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;
    
    try {
      const result: any = await api.post(`/pair-invitations/${invitationId}/cancel`);
      if (result.success) {
        alert('Invitation cancelled');
        fetchInvitations(); // Refresh list
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to cancel invitation');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: '#f59e0b',
      ACCEPTED: '#10b981',
      REJECTED: '#ef4444',
      CANCELLED: '#6b7280'
    };
    
    return (
      <span style={{
        backgroundColor: colors[status] || '#6b7280',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600
      }}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        Loading invitations...
      </div>
    );
  }

  if (!invitations) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        Failed to load invitations
      </div>
    );
  }

  const currentInvitations = activeTab === 'received' ? invitations.received : invitations.sent;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '24px' }}>
        Connection Requests
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '2px solid #e5e7eb' }}>
        <button
          onClick={() => setActiveTab('received')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'received' ? '#ec4899' : 'transparent',
            color: activeTab === 'received' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Received ({invitations.received.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          style={{
            padding: '12px 24px',
            backgroundColor: activeTab === 'sent' ? '#ec4899' : 'transparent',
            color: activeTab === 'sent' ? 'white' : '#6b7280',
            border: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Sent ({invitations.sent.length})
        </button>
      </div>

      {/* Invitations List */}
      <div style={{ display: 'grid', gap: '16px' }}>
        {currentInvitations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#9ca3af' }}>
            No {activeTab} invitations
          </div>
        ) : (
          currentInvitations.map((invitation) => (
            <div
              key={invitation.id}
              style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                justifyContent: 'space-between'
              }}
            >
              {/* User Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: invitation.user.avatar ? '#e5e7eb' : '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {invitation.user.avatar ? (
                    <img src={invitation.user.avatar} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  ) : (
                    '👤'
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>
                    {invitation.user.name || invitation.user.email}
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {invitation.user.email}
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    {getStatusBadge(invitation.status)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {activeTab === 'received' && invitation.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleAccept(invitation.id)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ✓ Accept
                    </button>
                    <button
                      onClick={() => handleReject(invitation.id)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      ✗ Reject
                    </button>
                  </>
                )}
                
                {activeTab === 'sent' && invitation.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(invitation.id)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#6b7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Cancel Request
                  </button>
                )}

                {invitation.status !== 'PENDING' && (
                  <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {invitation.respondedAt 
                      ? `Responded on ${new Date(invitation.respondedAt).toLocaleDateString()}`
                      : 'No response yet'}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Connected Pairs Section */}
      {invitations.received.some(inv => inv.status === 'ACCEPTED') || invitations.sent.some(inv => inv.status === 'ACCEPTED') ? (
        <>
          <div style={{ marginTop: '40px', borderTop: '2px solid #e5e7eb', paddingTop: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
              ❤️ Connected Partners
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[...invitations.received, ...invitations.sent]
                .filter(inv => inv.status === 'ACCEPTED')
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    style={{
                      backgroundColor: '#ecfdf5',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      padding: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>💑</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '16px' }}>
                        Connected with {invitation.user.name || invitation.user.email}
                      </div>
                      <div style={{ color: '#059669', fontSize: '14px', marginTop: '4px' }}>
                        Since {new Date(invitation.respondedAt!).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => window.location.href = '/couple-profile'}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      View Couple Profile →
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ConnectionRequestsView;

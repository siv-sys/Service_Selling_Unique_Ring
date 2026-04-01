import { useState } from 'react';

export default function ResetPasswordScreen({ onBackToLogin, onResetPassword, isSubmitting, errorMessage, successMessage }) {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onResetPassword({ email, newPassword });
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Reset Password</h2>
      {errorMessage && <div style={{ color: 'red' }}>{errorMessage}</div>}
      {successMessage && <div style={{ color: 'green' }}>{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', margin: '10px 0' }} required />
        <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: '100%', padding: '8px', margin: '10px 0' }} required />
        <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          {isSubmitting ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      <button onClick={onBackToLogin} style={{ marginTop: '10px', width: '100%', padding: '10px' }}>Back to Login</button>
    </div>
  );
}

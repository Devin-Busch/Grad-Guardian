import { useEffect, useState } from 'react';
import axios from 'axios';

const VALID_ROLES = ['system_admin', 'school_admin', 'teacher', 'student'];

export default function UsersAdmin({ token }) {
  const [rows, setRows]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [updatingEmail, setUpdatingEmail] = useState(null);

  // Invite states
  const [newEmail, setNewEmail]   = useState('');
  const [inviting, setInviting]   = useState(false);
  const [inviteError, setInviteError]     = useState(null);
  const [inviteMessage, setInviteMessage] = useState(null);

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/users');
      setRows(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleChangeRole = async (email, newRole) => {
    setUpdatingEmail(email);
    setError(null);
    try {
      await api.put(`/users/${encodeURIComponent(email)}`, { role: newRole });
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUpdatingEmail(null);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setInviteError(null);
    setInviteMessage(null);
    try {
      await api.post('/users', { email: newEmail });
      setInviteMessage(`Invited ${newEmail} as a teacher`);
      setNewEmail('');
      await fetchUsers();
    } catch (err) {
      setInviteError(err.response?.data?.error || err.message);
    } finally {
      setInviting(false);
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm(`Delete user ${email}?`)) return;
    setUpdatingEmail(email);
    setError(null);
    try {
      await api.delete(`/users/${encodeURIComponent(email)}`);
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setUpdatingEmail(null);
    }
  };

  return (
    <div>
      <h3>User Management</h3>

      {/* Invite form */}
      <div style={{ marginBottom: 20 }}>
        <form
          onSubmit={handleInvite}
          style={{ display: 'flex', gap: 8, alignItems: 'center' }}
        >
          <input
            type="email"
            placeholder="teacher@example.com"
            required
            value={newEmail}
            disabled={inviting}
            onChange={(e) => setNewEmail(e.target.value)}
            style={{ flex: 1, padding: '4px 8px' }}
          />
          <button type="submit" disabled={inviting || !newEmail}>
            {inviting ? 'Inviting…' : 'Invite New Teacher'}
          </button>
        </form>
        {inviteError && <p style={{ color: 'red' }}>{inviteError}</p>}
        {inviteMessage && <p style={{ color: 'green' }}>{inviteMessage}</p>}
      </div>

      {/* Users table */}
      {loading ? (
        <p>Loading users…</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : rows.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table
          border="1"
          cellPadding="6"
          style={{ borderCollapse: 'collapse', width: '100%' }}
        >
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>School ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.email}>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={updatingEmail === u.email}
                    onChange={(e) =>
                      handleChangeRole(u.email, e.target.value)
                    }
                  >
                    {VALID_ROLES.map((roleOption) => (
                      <option key={roleOption} value={roleOption}>
                        {roleOption}
                      </option>
                    ))}
                  </select>
                </td>
                <td align="center">{u.school_id ?? '—'}</td>
                <td align="center">
                  <button
                    onClick={() => handleDelete(u.email)}
                    disabled={updatingEmail === u.email}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

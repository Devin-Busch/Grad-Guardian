import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function UsersAdmin({ token }) {
  const [email, setEmail] = useState('');
  const [role, setRole]   = useState('teacher');
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const fetchUsers = () => {
    axios.get('http://localhost:3000/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setUsers(res.data))
    .catch(err => {
      console.error(err);
      setError('Failed to load users');
    });
  };

  useEffect(fetchUsers, [token]);

  const handleAdd = () => {
    if (!email.trim()) return;

    axios.post('http://localhost:3000/users', { email, role }, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(() => {
      setEmail('');
      setRole('teacher');
      fetchUsers();
    })
    .catch(err => {
      console.error(err);
      setError('Failed to add user');
    });
  };

  const handleDelete = (emailToDelete) => {
    if (!window.confirm(`Delete user ${emailToDelete}?`)) return;

    axios.delete(`http://localhost:3000/users/${encodeURIComponent(emailToDelete)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(fetchUsers)
    .catch(err => {
      console.error(err);
      setError('Failed to delete user');
    });
  };

  const grouped = users.reduce((acc, user) => {
    acc[user.role] = acc[user.role] || [];
    acc[user.role].push(user);
    return acc;
  }, {});

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>School Admin: Manage Users</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 20 }}>
        <h4>Add User</h4>
        <input
          type="email"
          placeholder="email@school.org"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <select value={role} onChange={e => setRole(e.target.value)} style={{ marginRight: 8 }}>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
          <option value="school_admin">School Admin</option>
        </select>
        <button onClick={handleAdd}>Add</button>
      </div>

      {['teacher', 'student', 'school_admin'].map(r => (
        grouped[r] && (
          <div key={r} style={{ marginBottom: 20 }}>
            <h4>{r.charAt(0).toUpperCase() + r.slice(1)}s</h4>
            <table border="1" cellPadding="6">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grouped[r].map(u => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    <td>{new Date(u.created_at).toLocaleString()}</td>
                    <td>
                      <button onClick={() => handleDelete(u.email)}>🗑️ Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ))}
    </div>
  );
}

// E:\gradGaurdian\school-risk-frontend\src\SystemAdmin.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function SystemAdmin({ token }) {
  const [schools, setSchools]       = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [districtName, setDistrictName] = useState('');
  const [saList, setSaList]         = useState([]);
  const [saEmail, setSaEmail]       = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
  });

  // Fetch schools & school_admins
  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [schRes, userRes] = await Promise.all([
        api.get('/schools'),
        api.get('/users')
      ]);
      setSchools(schRes.data);
      // filter for school_admin role
      setSaList(userRes.data.filter(u => u.role === 'school_admin'));
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // Create a new school
  const addSchool = async (e) => {
    e.preventDefault();
    await api.post('/schools', { school_name: schoolName, district_name: districtName });
    setSchoolName(''); setDistrictName('');
    await fetchAll();
  };

  // Delete a school
  const delSchool = async (id) => {
    if (!confirm('Delete this school and all its data?')) return;
    await api.delete(`/schools/${id}`);
    await fetchAll();
  };

  // Invite a new school_admin to a selected school
  const addSA = async (e) => {
    e.preventDefault();
    // Use POST /users with body { email, school_id }
    await api.post('/users', { email: saEmail, school_id: +e.target.schoolSelect.value });
    setSaEmail('');
    await fetchAll();
  };

  // Remove (demote) a school_admin → set them to 'teacher'
  const demote = async (email) => {
    if (!confirm(`Demote ${email} to teacher?`)) return;
    await api.put(`/users/${encodeURIComponent(email)}`, { role: 'teacher' });
    await fetchAll();
  };

  return (
    <div style={{ padding:24, fontFamily:'sans-serif' }}>
      <h3>System Administration</h3>
      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p style={{ color:'red' }}>Error: {error}</p>
      ) : (
        <>
          {/* ── Schools Management ───────────────────────────────── */}
          <section style={{ marginBottom:32 }}>
            <h4>Schools</h4>
            <ul>
              {schools.map(s => (
                <li key={s.school_id}>
                  {s.school_name} ({s.district_name})
                  <button
                    onClick={() => delSchool(s.school_id)}
                    style={{ marginLeft:8 }}
                  >Delete</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addSchool} style={{ display:'flex', gap:8, marginTop:12 }}>
              <input
                value={schoolName}
                onChange={e => setSchoolName(e.target.value)}
                placeholder="School Name"
                required
              />
              <input
                value={districtName}
                onChange={e => setDistrictName(e.target.value)}
                placeholder="District Name"
                required
              />
              <button type="submit">Add School</button>
            </form>
          </section>

          {/* ── School Admin Accounts ───────────────────────────── */}
          <section>
            <h4>School Administrators</h4>
            <ul>
              {saList.map(u => (
                <li key={u.email}>
                  {u.email} @ school #{u.school_id}
                  <button
                    onClick={() => demote(u.email)}
                    style={{ marginLeft:8 }}
                  >Demote</button>
                </li>
              ))}
            </ul>
            <form onSubmit={addSA} style={{ display:'flex', gap:8, marginTop:12 }}>
              <input
                value={saEmail}
                onChange={e => setSaEmail(e.target.value)}
                placeholder="admin@school.org"
                required
              />
              <select name="schoolSelect" required defaultValue="">
                <option value="" disabled>Select school</option>
                {schools.map(s => (
                  <option key={s.school_id} value={s.school_id}>
                    {s.school_name}
                  </option>
                ))}
              </select>
              <button type="submit">Invite School Admin</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}

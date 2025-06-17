// src/RiskDashboard.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE =
  // Use env var if provided (e.g. VITE_API_URL=http://localhost:3000)
  import.meta.env.VITE_API_URL?.replace(/\/+$/, '') || '';

const RiskDashboard = () => {
  const [students, setStudents] = useState([]);   // always an array
  const [error, setError]       = useState(null); // store fetch error

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/risk-dashboard`)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setStudents(data);
        console.log('Dashboard response:', res.data);
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
        setError('Unable to load risk dashboard.');
        setStudents([]); // keep it an array
      });
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div>
      <h2>Dropout Risk Dashboard</h2>

      {students.length === 0 ? (
        <p>No data yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade</th>
              <th>Risk %</th>
              <th>Level</th>
              <th>Flags</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.user_id}>
                <td>{s.last_name}, {s.first_name}</td>
                <td>{s.grade_level}</td>
                <td>{s.risk_score ?? '—'}</td>
                <td>{s.risk_level ?? '—'}</td>
                <td>
                  {(s.flags || []).map(f => (
                    <div key={f.reason}>{f.domain}: {f.reason}</div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default RiskDashboard;

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function StudentHome({ token }) {
  const [status, setStatus] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:3000/api/surveys/status", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setStatus(res.data))
    .catch(() => setError("Failed to load survey status"));
  }, [token]);

  const cardStyle = {
    border: "1px solid #ccc", padding: 20, marginBottom: 16, borderRadius: 8
  };

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h2>Your Surveys</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={cardStyle}>
        <h3>📋 Questionnaire 1: School Environment</h3>
        <p>Status: {status[1] ? "✅ Completed" : "❌ Not Completed"}</p>
        <Link to="/survey/1">Start or Edit Survey</Link>
      </div>

      <div style={cardStyle}>
        <h3>🏠 Questionnaire 2: Home & Background</h3>
        <p>Status: {status[2] ? "✅ Completed" : "❌ Not Completed"}</p>
        <Link to="/survey/2">Start or Edit Survey</Link>
      </div>
    </div>
  );
}

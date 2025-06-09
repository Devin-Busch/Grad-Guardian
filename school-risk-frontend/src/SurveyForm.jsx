// src/SurveyForm.jsx
//--------------------------------------------------------
// Simple four-domain survey. Drops downs 0-3.
// On submit it POSTs to /students with the ID token.
//--------------------------------------------------------
import { useState } from 'react';
import axios from 'axios';

const DOMAIN_NAMES = {
  1: 'Risky Behaviors / Low Self-Worth',
  2: 'Academic Disengagement',
  3: 'Psychological Disengagement',
  4: 'Poor School Performance'
};

export default function SurveyForm({ token, onCreated }) {
  const [scores, setScores] = useState({ 1: 0, 2: 0, 3: 0, 4: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (domainId, value) =>
    setScores((s) => ({ ...s, [domainId]: Number(value) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Build body
      const body = {
        first_name: 'Anonymous',
        last_name:  'Student',
        grade_level: '10',
        dew_score: 0,
        school_id: 1,                          // <-- your pilot school_id
        domain_scores: Object.entries(scores).map(
          ([domain_id, score]) => ({ domain_id: Number(domain_id), score })
        )
      };

      const res = await axios.post(
        'http://localhost:3000/students',
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onCreated(res.data.student_id);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
      <h3>Risk-Matrix Survey</h3>

      {Object.entries(DOMAIN_NAMES).map(([id, name]) => (
        <div key={id} style={{ margin: '8px 0' }}>
          <label>
            {name}:{' '}
            <select
              value={scores[id]}
              onChange={(e) => handleChange(id, e.target.value)}
            >
              <option value="0">0 – Green</option>
              <option value="1">1 – Yellow</option>
              <option value="2">2 – Orange</option>
              <option value="3">3 – Red</option>
            </select>
          </label>
        </div>
      ))}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit Survey'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

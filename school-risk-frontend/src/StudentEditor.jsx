// src/StudentEditor.jsx
//----------------------------------------------------
// Drawer with editable student fields + risk domains
//----------------------------------------------------
import { useEffect, useState } from 'react';
import Drawer from 'react-modern-drawer';
import 'react-modern-drawer/dist/index.css';
import useApi from './useApi';

const DOMAIN_NAMES = {
  1: 'Risky Behaviors / Low Self-Worth',
  2: 'Academic Disengagement',
  3: 'Psychological Disengagement',
  4: 'Poor School Performance'
};

export default function StudentEditor({ open, onClose, token, studentId, refreshList }) {
  const api = useApi(token);
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // load data when drawer opens
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await api.get(`/students/${studentId}`);
        setData(res.data);
      } catch (e) {
        setErr(e.response?.data?.error || e.message);
      }
    })();
  }, [open, studentId]);

  const changeDomain = (domain_id, val) => {
    setData(d => ({
      ...d,
      domain_scores: d.domain_scores.map(ds =>
        ds.domain_name === DOMAIN_NAMES[domain_id]
          ? { ...ds, score: Number(val) }
          : ds
      )
    }));
  };

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const body = {
        first_name: data.first_name,
        last_name:  data.last_name,
        grade_level:data.grade_level,
        support_staff:data.support_staff,
        dew_score:  data.dew_score,
        notes:      data.notes,
        domain_scores: data.domain_scores.map((ds, idx) => ({
          domain_id: idx + 1,
          score: ds.score
        }))
      };
      await api.put(`/students/${studentId}`, body);
      refreshList();
      onClose();
    } catch (e) {
      setErr(e.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      direction="right"
      size={380}
    >
      <div style={{ padding:24 }}>
        <h3>Edit Student</h3>
        {!data ? (
          <p>Loading…</p>
        ) : (
          <>
            {data.domain_scores.map((ds, idx) => (
              <div key={idx} style={{ margin:'8px 0' }}>
                <label>
                  {ds.domain_name}:{' '}
                  <select
                    value={ds.score}
                    onChange={e => changeDomain(idx + 1, e.target.value)}
                  >
                    <option value="0">0 – Green</option>
                    <option value="1">1 – Yellow</option>
                    <option value="2">2 – Orange</option>
                    <option value="3">3 – Red</option>
                  </select>
                </label>
              </div>
            ))}

            <button disabled={saving} onClick={save}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {err && <p style={{ color:'red' }}>{err}</p>}
          </>
        )}
      </div>
    </Drawer>
  );
}

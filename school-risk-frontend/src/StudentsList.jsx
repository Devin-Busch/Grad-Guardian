// E:\\gradGaurdian\\school-risk-frontend\\src\\StudentsList.jsx
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Lightweight Quill wrapper (no findDOMNode)
function RichEditor({ content, onChange }) {
  const editorRef = useRef(null);
  const quillRef  = useRef(null);

  useEffect(() => {
    quillRef.current = new Quill(editorRef.current, { theme: 'snow' });
    quillRef.current.root.innerHTML = content || '';
    quillRef.current.on('text-change', () => {
      onChange(quillRef.current.root.innerHTML);
    });
    return () => {
      quillRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!quillRef.current) return;
    const editor = quillRef.current;
    if (editor.root.innerHTML !== content) {
      const sel = editor.getSelection();
      editor.root.innerHTML = content || '';
      if (sel) editor.setSelection(sel);
    }
  }, [content]);

  return <div ref={editorRef} style={{ height: 200, marginBottom: 12 }} />;
}

export default function StudentsList({ token }) {
  // ── list state ───────────────────────────────────────────
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── edit drawer state ─────────────────────────────────────
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveError, setSaveError] = useState(null);

  // ── document state ───────────────────────────────────────
  const [docContent, setDocContent]       = useState('');
  const [revisions, setRevisions]         = useState([]);
  const [revPreview, setRevPreview]       = useState(null);
  const [docError, setDocError]           = useState(null);
  const [savingDoc, setSavingDoc]         = useState(false);

  const api = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  // ── Fetch students ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/students');
        setStudents(res.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Open edit drawer ──────────────────────────────────────
  const openEdit = (stu) => {
    setSelected(stu);
    setFormData({
      first_name:    stu.first_name,
      last_name:     stu.last_name,
      grade_level:   stu.grade_level,
      support_staff: stu.support_staff || '',
      dew_score:     stu.dew_score,
      notes:         stu.notes || '',
      domain_scores: stu.domain_scores
    });
    fetchDocument(stu.student_id);
    fetchRevisions(stu.student_id);
    setRevPreview(null);
  };

  // ── Save student basic info ──────────────────────────────
  const saveStudent = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await api.put(`/students/${selected.student_id}`, formData);
      const list = await api.get('/students');
      setStudents(list.data);
      setSelected(null);
    } catch (err) {
      setSaveError(err.response?.data?.error || err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Document handlers ────────────────────────────────────
  const fetchDocument = async (id) => {
    setDocError(null);
    try {
      const res = await api.get(`/students/${id}/document`);
      setDocContent(res.data.content);
    } catch (err) {
      if (err.response?.status === 404) {
        setDocContent('');
      } else {
        setDocError(err.response?.data?.error || err.message);
      }
    }
  };
  const fetchRevisions = async (id) => {
    try {
      const res = await api.get(`/students/${id}/document/revisions`);
      setRevisions(res.data);
    } catch {
      setRevisions([]);
    }
  };
  const saveDocument = async () => {
    setSavingDoc(true);
    setDocError(null);
    try {
      await api.put(`/students/${selected.student_id}/document`, { content: docContent });
      fetchRevisions(selected.student_id);
    } catch (err) {
      setDocError(err.response?.data?.error || err.message);
    } finally {
      setSavingDoc(false);
    }
  };
  const previewRevision = async (revId) => {
    try {
      const res = await api.get(`/students/${selected.student_id}/document/revisions/${revId}`);
      setRevPreview(res.data);
    } catch {}
  };

  return (
    <div>
      <h3>Staff View</h3>
      {loading ? (
        <p>Loading students…</p>
      ) : error ? (
        <p style={{ color: 'red' }}>Error: {error}</p>
      ) : (
        <table border="1" cellPadding="6" style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr><th>ID</th><th>Name</th><th>Grade</th><th>Risk</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.student_id}>
                <td>{s.student_id}</td>
                <td>{s.first_name} {s.last_name}</td>
                <td>{s.grade_level}</td>
                <td>{s.risk_level}</td>
                <td><button onClick={() => openEdit(s)}>View / Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selected && (
        <div style={{ marginTop:20, padding:16, border:'1px solid #ccc', borderRadius:4, background:'#fafafa' }}>
          <h4>
            Editing: {selected.first_name} {selected.last_name} {' '}
            <button onClick={() => setSelected(null)} disabled={saving}>Close</button>
          </h4>

          {/* Basic fields & domain scores omitted for brevity */}

          <button onClick={saveStudent} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          {saveError && <p style={{ color: 'red' }}>{saveError}</p>}

          <section style={{ marginTop:24 }}>
            <h5>Student Document</h5>
            {docError && <p style={{ color:'red' }}>{docError}</p>}

            <RichEditor content={docContent} onChange={setDocContent} />
            <button onClick={saveDocument} disabled={savingDoc}>
              {savingDoc ? 'Saving…' : 'Save Document'}
            </button>

            <h6 style={{ marginTop:16 }}>Revision History</h6>
            <ul style={{ maxHeight:120, overflowY:'auto', padding:'0 12px' }}>
              {revisions.length === 0 && <li><em>No revisions yet</em></li>}
              {revisions.map(r => (
                <li key={r.revision_id}>
                  <button
                    style={{ background:'none', border:'none', color:'#007bff', cursor:'pointer' }}
                    onClick={() => previewRevision(r.revision_id)}
                  >
                    {new Date(r.created_at).toLocaleString()} by {r.author_email}
                  </button>
                </li>
              ))}
            </ul>

            {revPreview && (
              <div style={{ marginTop:12, padding:12, border:'1px solid #ddd', borderRadius:4, background:'#fff' }}>
                <h6>Preview — {new Date(revPreview.created_at).toLocaleString()}</h6>
                <div dangerouslySetInnerHTML={{ __html: revPreview.content }} style={{ border:'1px dashed #ccc', padding:8 }} />
                <button onClick={() => setRevPreview(null)}>Close Preview</button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const SurveyForm = () => {
  const { number } = useParams(); // number = 1 or 2
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const questions = {
    1: [
      'I enjoy coming to school.',
      'I feel connected to my classmates.',
      'I can talk to teachers when I need help.',
      'I understand what is expected of me in class.',
      'I care about my schoolwork.',
      'I am motivated to do well in school.'
    ],
    2: [
      'I have a quiet place to study at home.',
      'My family supports my learning.',
      'I get enough sleep on school nights.',
      'I can focus well during class.',
      'I have responsibilities outside school (like work or care).',
      'My home life is stable.'
    ]
  };

  const qList = questions[number] || [];

  const handleChange = (qid, val) => {
    setAnswers(prev => ({ ...prev, [qid]: parseInt(val) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await axios.post(`/api/surveys/${number}`, { answers });
      navigate('/student');
    } catch (err) {
      console.error(err);
      setError('Failed to submit survey.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Survey {number}</h2>
      <p>Please only answer questions you feel comfortable sharing. Leave any blank if needed.</p>
      <form onSubmit={handleSubmit}>
        {qList.map((q, i) => (
          <div key={i}>
            <label>{q}</label><br />
            <select value={answers[i + 1] || ''} onChange={e => handleChange(i + 1, e.target.value)}>
              <option value="">No answer</option>
              <option value="3">Strongly Agree</option>
              <option value="2">Agree</option>
              <option value="1">Disagree</option>
              <option value="0">Strongly Disagree</option>
            </select>
          </div>
        ))}
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Submit Survey'}</button>
      </form>
    </div>
  );
};

export default SurveyForm;

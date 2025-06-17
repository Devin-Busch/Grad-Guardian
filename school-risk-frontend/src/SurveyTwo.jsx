// school-risk-frontend/src/SurveyTwo.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

//message to student
<p style={{ fontStyle: "italic", color: "#555", marginBottom: 16 }}>
  Please only answer questions you're comfortable sharing. You may leave any question blank.
</p>

// Sample questions for Q2 (replace with full list)
const QUESTIONS = [
  "There is stability in my home life.",
  "I have access to a quiet space for studying.",
  "My family encourages me to succeed in school.",
  "I have responsibilities at home that interfere with schoolwork.",
  "There are reliable adults in my life who support me.",
  "I feel safe at home."
];

const SCALE = [
  { value: 0, label: "Strongly Disagree" },
  { value: 1, label: "Disagree" },
  { value: 2, label: "Agree" },
  { value: 3, label: "Strongly Agree" }
];

export default function SurveyTwo({ token }) {
  const [answers, setAnswers] = useState({});
  const [error, setError]     = useState(null);
  const navigate              = useNavigate();

  const handleChange = (qIndex, value) => {
    setAnswers({ ...answers, [qIndex]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(answers).length === 0) {
      return setError("You must answer at least one question.");
    }


    try {
      await axios.post(
        "http://localhost:3000/api/surveys/2",
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/thank-you");
    } catch (err) {
      console.error(err);
      setError("Something went wrong saving your responses.");
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h2>Home & Demographics Survey (Q2)</h2>
      <form onSubmit={handleSubmit}>
        {QUESTIONS.map((question, idx) => (
          <div key={idx} style={{ marginBottom: "1.5rem" }}>
            <p><strong>{idx + 1}. {question}</strong></p>
            {SCALE.map(option => (
              <label key={option.value} style={{ marginRight: "1rem" }}>
                <input
                  type="radio"
                  name={`q${idx}`}
                  value={option.value}
                  checked={answers[idx] === option.value}
                  onChange={() => handleChange(idx, option.value)}
                />{" "}
                {option.label}
              </label>
            ))}
          </div>
        ))}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

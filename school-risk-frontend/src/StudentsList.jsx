import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const StudentsList = () => {
  const [students, setStudents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get('/students')
      .then(res => setStudents(res.data))
      .catch(err => console.error('Failed to load students:', err));
  }, []);

  const handleSelect = (id) => {
    navigate(`/staff/student/${id}`);
  };

  return (
    <div>
      <h2>My Students</h2>
      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Grade</th>
              <th>DEWS</th>
              <th>Total Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.user_id}>
                <td>{s.last_name}, {s.first_name}</td>
                <td>{s.grade_level}</td>
                <td>{s.dew_score ?? '—'}</td>
                <td>{s.total_score ?? '—'}</td>
                <td>
                  <button onClick={() => handleSelect(s.user_id)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentsList;

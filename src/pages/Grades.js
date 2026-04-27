import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { gradesAPI, subjectsAPI } from '../api/api';
import './Grades.css';

const Grades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsRes = await subjectsAPI.getSubjects();
        setSubjects(subjectsRes.data);

        const studentId = user?.role === 'parent' && user?.child_ids?.length > 0 
          ? user.child_ids[0] 
          : user?.id;

        const params = selectedSubject ? { subject_id: selectedSubject } : {};
        const gradesRes = await gradesAPI.getStudentGrades(studentId, params);
        setGrades(gradesRes.data);
      } catch (error) {
        console.error('Ошибка загрузки оценок:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, selectedSubject]);

  const calculateAverage = (subjectId) => {
    const subjectGrades = grades.filter(g => g.subject_id === subjectId);
    if (subjectGrades.length === 0) return null;
    const sum = subjectGrades.reduce((acc, g) => acc + g.value, 0);
    return (sum / subjectGrades.length).toFixed(2);
  };

  const groupedGrades = grades.reduce((acc, grade) => {
    if (!acc[grade.subject_id]) {
      acc[grade.subject_id] = [];
    }
    acc[grade.subject_id].push(grade);
    return acc;
  }, {});

  const subjectEntries = Object.entries(groupedGrades).sort((a, b) => {
    const subjectA = subjects.find(s => s.id === a[0]);
    const subjectB = subjects.find(s => s.id === b[0]);
    return (subjectA?.name || '').localeCompare(subjectB?.name || '');
  });

  if (loading) {
    return <div className="loading">Загрузка оценок...</div>;
  }

  return (
    <div className="grades-page">
      <div className="page-header">
        <h1>Оценки</h1>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="subject-filter"
        >
          <option value="">Все предметы</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {subjectEntries.length === 0 ? (
        <div className="empty-state">Нет оценок</div>
      ) : (
        <div className="grades-container">
          {subjectEntries.map(([subjectId, subjectGrades]) => {
            const average = calculateAverage(subjectId);
            const subject = subjects.find(s => s.id === subjectId);
            
            return (
              <div key={subjectId} className="subject-grades-card">
                <div className="subject-header">
                  <h2>{subject?.name || subjectId}</h2>
                  {average && (
                    <span className="average-grade">
                      Средний балл: <strong>{average}</strong>
                    </span>
                  )}
                </div>
                <div className="grades-grid">
                  {subjectGrades
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((grade) => (
                      <div key={grade.id} className={`grade-card grade-${grade.value}`}>
                        <div className="grade-value">{grade.value}</div>
                        <div className="grade-details">
                          <div className="grade-date">
                            {new Date(grade.date).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                          {grade.comment && (
                            <div className="grade-comment">{grade.comment}</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Grades;

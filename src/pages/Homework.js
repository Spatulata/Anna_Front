import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { homeworkAPI, subjectsAPI } from '../api/api';
import './Homework.css';

const Homework = () => {
  const { user } = useAuth();
  const [homework, setHomework] = useState([]);
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

        const homeworkRes = await homeworkAPI.getStudentHomework(studentId);
        let filteredHomework = homeworkRes.data;

        if (selectedSubject) {
          filteredHomework = filteredHomework.filter(hw => hw.subject_id === selectedSubject);
        }

        // Сортируем по дате сдачи
        filteredHomework.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
        
        setHomework(filteredHomework);
      } catch (error) {
        console.error('Ошибка загрузки домашних заданий:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user, selectedSubject]);

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate) => {
    const daysUntilDue = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilDue <= 3 && daysUntilDue >= 0;
  };

  if (loading) {
    return <div className="loading">Загрузка домашних заданий...</div>;
  }

  return (
    <div className="homework-page">
      <div className="page-header">
        <h1>Домашние задания</h1>
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

      {homework.length === 0 ? (
        <div className="empty-state">Нет домашних заданий</div>
      ) : (
        <div className="homework-container">
          {homework.map((hw) => {
            const overdue = isOverdue(hw.due_date);
            const dueSoon = isDueSoon(hw.due_date);
            const subject = subjects.find(s => s.id === hw.subject_id);

            return (
              <div
                key={hw.id}
                className={`homework-card ${overdue ? 'overdue' : ''} ${dueSoon ? 'due-soon' : ''}`}
              >
                <div className="homework-header">
                  <div className="homework-title-section">
                    <h3>{hw.title}</h3>
                    <div className="homework-subject">
                      <span className="subject-label">Предмет:</span>
                      <strong>{subject?.name || hw.subject_id}</strong>
                    </div>
                  </div>
                  <span className={`due-date ${overdue ? 'overdue' : ''} ${dueSoon ? 'due-soon' : ''}`}>
                    {new Date(hw.due_date).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="homework-description">
                  {hw.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Homework;

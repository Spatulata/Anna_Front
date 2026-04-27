import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { classesAPI, subjectsAPI, gradesAPI, scheduleAPI, usersAPI } from '../api/api';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [classGrades, setClassGrades] = useState([]);
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGrade, setNewGrade] = useState({ studentId: '', value: 5, date: new Date().toISOString().split('T')[0], comment: '' });

  // Загрузка классов и предметов
  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesRes, subjectsRes] = await Promise.all([
          classesAPI.getClasses(),
          subjectsAPI.getSubjects()
        ]);
        setClasses(classesRes.data || []);
        setSubjects(subjectsRes.data || []);

        // Загрузка расписания учителя
        try {
          const scheduleRes = await scheduleAPI.getTeacherSchedule(user.id);
          setTeacherSchedule(scheduleRes.data || []);
        } catch (e) {
          console.warn('Не удалось загрузить расписание:', e);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user]);

  // Загрузка учеников класса
  useEffect(() => {
    if (!selectedClass) return;
    const loadStudents = async () => {
      try {
        const res = await usersAPI.getClassStudents(selectedClass);
        setStudents(res.data || []);
      } catch (error) {
        console.error('Ошибка загрузки учеников:', error);
        setStudents([]);
      }
    };
    loadStudents();
  }, [selectedClass]);

  // Загрузка оценок класса по предмету
  useEffect(() => {
    if (!selectedClass || !selectedSubject) return;
    const loadGrades = async () => {
      try {
        const res = await gradesAPI.getClassGrades(selectedClass, selectedSubject);
        setClassGrades(res.data || []);
      } catch (error) {
        console.error('Ошибка загрузки оценок:', error);
        setClassGrades([]);
      }
    };
    loadGrades();
  }, [selectedClass, selectedSubject]);

  // Добавить оценку
  const handleAddGrade = async () => {
    if (!newGrade.studentId || !selectedSubject) {
      window.alert('Выберите ученика и предмет');
      return;
    }
    try {
      await gradesAPI.createGrade({
        student_id: newGrade.studentId,
        subject_id: selectedSubject,
        value: parseInt(newGrade.value),
        date: newGrade.date,
        comment: newGrade.comment || undefined,
        teacher_id: user.id
      });
      setNewGrade({ studentId: '', value: 5, date: new Date().toISOString().split('T')[0], comment: '' });
      // Перезагрузить оценки
      const res = await gradesAPI.getClassGrades(selectedClass, selectedSubject);
      setClassGrades(res.data || []);
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось добавить оценку'));
    }
  };

  // Обновить оценку
  const handleUpdateGrade = async (gradeId, value) => {
    try {
      await gradesAPI.updateGrade(gradeId, { value });
      const res = await gradesAPI.getClassGrades(selectedClass, selectedSubject);
      setClassGrades(res.data || []);
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось обновить'));
    }
  };

  // Удалить оценку
  const handleDeleteGrade = async (gradeId) => {
    if (!window.confirm('Удалить эту оценку?')) return;
    try {
      await gradesAPI.deleteGrade(gradeId);
      const res = await gradesAPI.getClassGrades(selectedClass, selectedSubject);
      setClassGrades(res.data || []);
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось удалить'));
    }
  };

  // Получить расписание по дням недели
  const getScheduleByDay = () => {
    const days = {};
    teacherSchedule.forEach(item => {
      if (!days[item.day_of_week]) days[item.day_of_week] = [];
      days[item.day_of_week].push(item);
    });
    return days;
  };

  const scheduleByDay = getScheduleByDay();
  const dayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
  const dayNamesShort = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name || id;
  const getClassName = (id) => {
    const cls = classes.find(c => c.id === id);
    return cls ? `${cls.grade}${cls.letter}` : id;
  };
  const getStudentName = (id) => students.find(s => s.id === id)?.full_name || id;

  if (loading) return <div className="teacher-loading">Загрузка данных учителя...</div>;

  // Классы, где учитель преподаёт (или все классы если нет привязки)
  const myClasses = classes.filter(c => c.teachers?.includes(user.id));
  const availableClasses = myClasses.length > 0 ? myClasses : classes;
  const mySubjectIds = user?.subject_ids || [];
  const availableSubjects = mySubjectIds.length > 0
    ? subjects.filter(s => mySubjectIds.includes(s.id))
    : subjects;

  const sortedClassGrades = [...classGrades].sort((a, b) => new Date(b.date) - new Date(a.date));
  const journalRows = students
    .map((student) => {
      const studentGrades = sortedClassGrades.filter((grade) => grade.student_id === student.id);
      const total = studentGrades.reduce((sum, grade) => sum + grade.value, 0);
      const average = studentGrades.length > 0 ? (total / studentGrades.length).toFixed(2) : null;
      return {
        studentId: student.id,
        studentName: student.full_name,
        grades: studentGrades,
        average,
      };
    })
    .sort((a, b) => a.studentName.localeCompare(b.studentName, 'ru'));

  return (
    <div className="teacher-dashboard">
      <div className="teacher-header">
        <h1>Кабинет учителя</h1>
        <p className="teacher-subtitle">{user?.full_name}</p>
      </div>

      {/* Табы */}
      <div className="teacher-tabs">
        <button
          className={`teacher-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📅 Моё расписание
        </button>
        <button
          className={`teacher-tab ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          📝 Журнал оценок
        </button>
        <button
          className={`teacher-tab ${activeTab === 'homework' ? 'active' : ''}`}
          onClick={() => setActiveTab('homework')}
        >
          📚 Домашние задания
        </button>
      </div>

      {/* Расписание */}
      {activeTab === 'schedule' && (
        <div className="teacher-schedule">
          {teacherSchedule.length === 0 ? (
            <div className="empty-state">Расписание не заполнено</div>
          ) : (
            <div className="schedule-grid">
              {[0, 1, 2, 3, 4].map(day => (
                <div key={day} className="schedule-day-card">
                  <div className="day-header">{dayNames[day]}</div>
                  {scheduleByDay[day]?.sort((a, b) => a.lesson_number - b.lesson_number).map(item => (
                    <div key={item.id} className="lesson-card">
                      <div className="lesson-number">Урок {item.lesson_number}</div>
                      <div className="lesson-subject">{getSubjectName(item.subject_id)}</div>
                      <div className="lesson-class">{getClassName(item.class_id)}</div>
                      {item.room && <div className="lesson-room">Каб. {item.room}</div>}
                    </div>
                  ))}
                  {!scheduleByDay[day] && <div className="no-lessons">Нет уроков</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Журнал оценок */}
      {activeTab === 'grades' && (
        <div className="teacher-grades">
          <div className="grades-filters">
            <div className="filter-group">
              <label>Класс</label>
              <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Выберите класс</option>
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.grade}{c.letter}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Предмет</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="">Выберите предмет</option>
                {availableSubjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedClass && selectedSubject && (
            <>
              {/* Форма добавления оценки */}
              <div className="add-grade-form">
                <h3>Добавить оценку</h3>
                <div className="form-row">
                  <select
                    value={newGrade.studentId}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, studentId: e.target.value }))}
                  >
                    <option value="">Выберите ученика</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newGrade.value}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, value: e.target.value }))}
                    placeholder="Оценка"
                  />
                  <input
                    type="date"
                    value={newGrade.date}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, date: e.target.value }))}
                  />
                  <input
                    type="text"
                    placeholder="Комментарий (необязательно)"
                    value={newGrade.comment}
                    onChange={(e) => setNewGrade(prev => ({ ...prev, comment: e.target.value }))}
                  />
                  <button className="btn-add-grade" onClick={handleAddGrade}>Добавить</button>
                </div>
              </div>

              {/* Таблица оценок */}
              <div className="grades-table-wrapper">
                {journalRows.length === 0 ? (
                  <div className="empty-state">В выбранном классе пока нет учеников</div>
                ) : (
                  <>
                    <div className="journal-header">
                      <h3>
                        Журнал: {getClassName(selectedClass)} - {getSubjectName(selectedSubject)}
                      </h3>
                      <span className="journal-meta">
                        Учеников: {journalRows.length} | Оценок: {classGrades.length}
                      </span>
                    </div>
                  <table className="teacher-grades-table">
                    <thead>
                      <tr>
                        <th>Ученик</th>
                        <th>Последние оценки</th>
                        <th>Средний балл</th>
                        <th>Последняя дата</th>
                        <th>Действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {journalRows.map((row) => (
                        <tr key={row.studentId}>
                          <td>{row.studentName}</td>
                          <td>
                            {row.grades.length === 0 ? (
                              <span className="no-grades-inline">Нет оценок</span>
                            ) : (
                              <div className="grade-badges-row">
                                {row.grades.slice(0, 8).map((grade) => (
                                  <span key={grade.id} className={`grade-badge grade-${grade.value}`} title={grade.comment || ''}>
                                    {grade.value}
                                  </span>
                                ))}
                                {row.grades.length > 8 && (
                                  <span className="more-grades-badge">+{row.grades.length - 8}</span>
                                )}
                              </div>
                            )}
                          </td>
                          <td>{row.average || '—'}</td>
                          <td>{row.grades[0] ? new Date(row.grades[0].date).toLocaleDateString('ru-RU') : '—'}</td>
                          <td>
                            {row.grades[0] ? (
                              <div className="row-actions">
                                <input
                                  type="number"
                                  min="1"
                                  max="5"
                                  className="inline-grade-input"
                                  onBlur={(e) => {
                                    if (e.target.value && parseInt(e.target.value) !== row.grades[0].value) {
                                      handleUpdateGrade(row.grades[0].id, parseInt(e.target.value));
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.target.blur();
                                    }
                                  }}
                                  placeholder="Новая"
                                  title="Изменить последнюю оценку"
                                />
                                <button className="btn-delete-grade" onClick={() => handleDeleteGrade(row.grades[0].id)} title="Удалить последнюю оценку">
                                  🗑️
                                </button>
                              </div>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Домашние задания (заглушка) */}
      {activeTab === 'homework' && (
        <div className="teacher-homework">
          <div className="empty-state">
            <p>📚 Раздел домашних заданий</p>
            <p className="empty-subtitle">Здесь вы сможете создавать и управлять домашними заданиями</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;

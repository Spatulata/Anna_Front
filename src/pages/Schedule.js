import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { scheduleAPI, subjectsAPI } from '../api/api';
import './Schedule.css';

const Schedule = () => {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState({});
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Получаем даты для одной недели (7 дней)
  const getWeekDates = () => {
    const dates = [];
    const today = new Date();
    const currentDay = today.getDay(); // 0 = воскресенье, 1 = понедельник, ...
    
    // Находим понедельник текущей недели
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    // Генерируем 7 дней (текущая неделя)
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push({
        date: date,
        dayOfWeek: date.getDay() === 0 ? 6 : date.getDay() - 1, // Преобразуем: понедельник = 0, воскресенье = 6
        dayIndex: i,
      });
    }
    
    return dates;
  };

  const getDayName = (dayIndex) => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return days[dayIndex];
  };

  const getDateLabel = (date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}.${month.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsRes = await subjectsAPI.getSubjects();
        setSubjects(subjectsRes.data);

        const studentId = user?.role === 'parent' && user?.child_ids?.length > 0 
          ? user.child_ids[0] 
          : user?.id;

        // Загружаем расписание для всех дней недели (0-6, где 0 = понедельник)
        const scheduleData = {};
        for (let day = 0; day < 7; day++) {
          try {
            const scheduleRes = await scheduleAPI.getStudentSchedule(studentId, {
              day_of_week: day,
            });
            scheduleData[day] = scheduleRes.data.sort((a, b) => a.lesson_number - b.lesson_number);
          } catch (error) {
            scheduleData[day] = [];
          }
        }
        setSchedule(scheduleData);
      } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const renderScheduleTable = (dates) => {
    return (
      <table className="schedule-table">
        <thead>
          <tr>
            <th className="schedule-th schedule-lesson-th">Урок</th>
            {dates.map((dateInfo, idx) => (
              <th key={idx} className="schedule-th">
                <div className="schedule-th-content">
                  <div className="schedule-th-day">{getDayName(dateInfo.dayOfWeek)}</div>
                  <div className="schedule-th-date">{getDateLabel(dateInfo.date)}</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[0, 1, 2, 3, 4, 5].map((lessonNum) => (
            <tr key={lessonNum}>
              <td className="schedule-td schedule-lesson-num-cell">
                {lessonNum + 1}
              </td>
              {dates.map((dateInfo, dayIdx) => {
                const daySchedule = schedule[dateInfo.dayOfWeek] || [];
                const lesson = daySchedule.find(l => l.lesson_number === lessonNum + 1);
                const subject = lesson ? subjects.find(s => s.id === lesson.subject_id) : null;
                return (
                  <td key={dayIdx} className="schedule-td">
                    {subject ? (
                      <div className="schedule-lesson">
                        <span className="schedule-lesson-name">{subject.name}</span>
                        {lesson.room && (
                          <span className="schedule-lesson-room">{lesson.room}</span>
                        )}
                      </div>
                    ) : (
                      <div className="schedule-lesson empty">-</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  if (loading) {
    return <div className="schedule-loading">Загрузка расписания...</div>;
  }

  const weekDates = getWeekDates();

  return (
    <div className="schedule-page">
      <h1>Расписание на неделю</h1>
      
      <div className="schedule-container">
        <div className="schedule-wrapper">
          {renderScheduleTable(weekDates)}
        </div>
      </div>
    </div>
  );
};

export default Schedule;

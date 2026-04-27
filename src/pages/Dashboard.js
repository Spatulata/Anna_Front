import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { gradesAPI, homeworkAPI, scheduleAPI, subjectsAPI } from '../api/api';
import './Dashboard.css';

// Компонент кругового графика
const DoughnutChart = ({ distribution }) => {
  if (!distribution) return null;

  const { percentages } = distribution;
  const size = 140;
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = 55;
  const innerRadius = 35;
  const strokeWidth = radius - innerRadius;
  
  // Цвета для оценок: 5 - зеленый, 2 - красный, остальные промежуточные
  const colors = {
    5: '#27ae60', // зеленый для 5
    4: '#f39c12', // желтый/оранжевый для 4 (промежуточный)
    3: '#e67e22', // оранжевый для 3 (промежуточный)
    2: '#e74c3c', // красный для 2
    1: '#c0392b', // темно-красный для 1
  };

  // Функция для создания пути сегмента
  const createArcPath = (startAngle, endAngle, outerRadius, innerRadius) => {
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const x1 = centerX + outerRadius * Math.cos(startAngleRad);
    const y1 = centerY + outerRadius * Math.sin(startAngleRad);
    const x2 = centerX + outerRadius * Math.cos(endAngleRad);
    const y2 = centerY + outerRadius * Math.sin(endAngleRad);
    
    const x3 = centerX + innerRadius * Math.cos(endAngleRad);
    const y3 = centerY + innerRadius * Math.sin(endAngleRad);
    const x4 = centerX + innerRadius * Math.cos(startAngleRad);
    const y4 = centerY + innerRadius * Math.sin(startAngleRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ');
  };

  // Вычисляем углы для каждого сегмента
  let currentAngle = -90; // Начинаем сверху
  const segments = [];
  const grades = [5, 4, 3, 2, 1].filter(grade => percentages[grade] > 0);

  grades.forEach(grade => {
    const percentage = percentages[grade];
    if (percentage > 0) {
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      segments.push(
        <path
          key={grade}
          d={createArcPath(startAngle, endAngle, radius, innerRadius)}
          fill={colors[grade]}
          stroke="#1e2832"
          strokeWidth="2"
        />
      );

      currentAngle += angle;
    }
  });

  return (
    <div className="doughnut-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Фоновое кольцо */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#2a3540"
          strokeWidth={strokeWidth}
        />
        {/* Сегменты */}
        {segments}
      </svg>
    </div>
  );
};

// Компонент линейного графика
const LineChart = ({ grades }) => {
  if (!grades || grades.length === 0) return null;

  const maxGrade = 5;
  const minGrade = 1;
  const chartHeight = 200;
  const padding = { top: 15, right: 20, bottom: 45, left: 40 };

  // Минимальное расстояние между точками по X
  const minPointSpacing = 40;

  // Ограничиваем количество отображаемых точек для читаемости
  const displayGrades = grades.length > 80 ? grades.slice(-80) : grades;

  const contentWidth = Math.max(250, displayGrades.length * minPointSpacing);
  const svgWidth = padding.left + contentWidth + padding.right;
  const chartAreaWidth = contentWidth;
  const chartAreaHeight = chartHeight - padding.top - padding.bottom;

  const points = displayGrades.map((grade, idx) => {
    const x = padding.left + (displayGrades.length === 1
      ? chartAreaWidth / 2
      : (idx / (displayGrades.length - 1)) * chartAreaWidth);
    const y = padding.top + chartAreaHeight - ((grade.value - minGrade) / (maxGrade - minGrade)) * chartAreaHeight;
    return { x, y, value: grade.value, date: grade.date };
  });

  const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  // Цвета для точек
  const getPointColor = (value) => {
    if (value >= 5) return '#27ae60';
    if (value >= 4) return '#f1c40f';
    if (value >= 3) return '#e67e22';
    return '#e74c3c';
  };

  // Определяем шаг меток по X так, чтобы они не слипались
  const minLabelSpacing = 60;
  const totalLabels = Math.floor(contentWidth / minLabelSpacing);
  const xLabelInterval = Math.max(1, Math.ceil(displayGrades.length / totalLabels));

  return (
    <div className="line-chart" style={{ overflowX: contentWidth > 400 ? 'auto' : 'hidden' }}>
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${svgWidth} ${chartHeight}`} preserveAspectRatio="xMidYMid meet">
        {/* Сетка */}
        {[5, 4, 3, 2].map(grade => {
          const y = padding.top + chartAreaHeight - ((grade - minGrade) / (maxGrade - minGrade)) * chartAreaHeight;
          return (
            <line
              key={`grid-${grade}`}
              x1={padding.left}
              y1={y}
              x2={padding.left + chartAreaWidth}
              y2={y}
              stroke="#2a3540"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Метки Y */}
        {[5, 4, 3, 2, 1].map(grade => {
          const y = padding.top + chartAreaHeight - ((grade - minGrade) / (maxGrade - minGrade)) * chartAreaHeight;
          return (
            <text key={grade} x={padding.left - 8} y={y + 4} fill="#8899aa" fontSize="11" textAnchor="end">{grade}</text>
          );
        })}

        {/* Линия графика */}
        <path d={pathData} fill="none" stroke="#3498db" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Точки */}
        {points.map((point, idx) => {
          const color = getPointColor(point.value);
          return (
            <circle
              key={idx}
              cx={point.x}
              cy={point.y}
              r="5"
              fill={color}
              stroke="#1e2832"
              strokeWidth="2"
              className="grade-point"
            >
              <title>{point.value} — {new Date(point.date).toLocaleDateString('ru-RU')}</title>
            </circle>
          );
        })}

        {/* Ось X */}
        <line
          x1={padding.left}
          y1={padding.top + chartAreaHeight}
          x2={padding.left + chartAreaWidth}
          y2={padding.top + chartAreaHeight}
          stroke="#3a4a5a"
          strokeWidth="1"
        />

        {/* Метки X (даты) */}
        {points.map((point, idx) => {
          if (idx % xLabelInterval === 0 || idx === points.length - 1) {
            const date = new Date(point.date);
            const day = date.getDate();
            const month = date.toLocaleDateString('ru-RU', { month: 'short' });
            const isLast = idx === points.length - 1;
            const isFirst = idx === 0;
            return (
              <g key={idx}>
                <text
                  x={point.x}
                  y={padding.top + chartAreaHeight + 18}
                  fill="#b0bec5"
                  fontSize="10"
                  textAnchor="middle"
                >
                  {day}
                </text>
                {(isLast || isFirst) && (
                  <text
                    x={point.x}
                    y={padding.top + chartAreaHeight + 32}
                    fill="#607d8b"
                    fontSize="9"
                    textAnchor="middle"
                  >
                    {month}
                  </text>
                )}
              </g>
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    recentGrades: [],
    allGrades: [], // Все оценки для фильтрации
    upcomingHomework: [],
    todaySchedule: [],
    weekSchedule: [],
    averageGrade: null,
    subjectStats: {},
  });
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('quarter'); // week, quarter

  useEffect(() => {
    const loadData = async () => {
      try {
        const subjectsRes = await subjectsAPI.getSubjects();
        setSubjects(subjectsRes.data);

        const studentId = user?.role === 'parent' && user?.child_ids?.length > 0 
          ? user.child_ids[0] 
          : user?.id;

        if (user?.role === 'student' || user?.role === 'parent') {
          // Загружаем все оценки
          const gradesRes = await gradesAPI.getStudentGrades(studentId);
          const allGrades = gradesRes.data;
          const recentGrades = allGrades.slice(0, 5);
          
          // Вычисляем средний балл по всем оценкам
          if (allGrades.length > 0) {
            const total = allGrades.reduce((sum, g) => sum + g.value, 0);
            const avg = (total / allGrades.length).toFixed(1);
            setStats(prev => ({ ...prev, averageGrade: parseFloat(avg) }));
          }

          // Статистика по предметам
          const subjectStats = {};
          allGrades.forEach(grade => {
            if (!subjectStats[grade.subject_id]) {
              subjectStats[grade.subject_id] = { grades: [], total: 0 };
            }
            subjectStats[grade.subject_id].grades.push(grade.value);
            subjectStats[grade.subject_id].total += grade.value;
          });
          
          Object.keys(subjectStats).forEach(subjId => {
            const count = subjectStats[subjId].grades.length;
            subjectStats[subjId].average = (subjectStats[subjId].total / count).toFixed(1);
          });

          // Загружаем предстоящие домашние задания
          const homeworkRes = await homeworkAPI.getStudentHomework(studentId);
          const upcomingHomework = homeworkRes.data
            .filter(hw => new Date(hw.due_date) >= new Date())
            .slice(0, 3);

          // Загружаем расписание на сегодня
          const today = new Date().getDay();
          // Преобразуем: воскресенье (0) -> 6, понедельник (1) -> 0, вторник (2) -> 1, и т.д.
          const dayOfWeek = today === 0 ? 6 : today - 1;
          const scheduleRes = await scheduleAPI.getStudentSchedule(studentId, {
            day_of_week: dayOfWeek,
          });
          // Фильтруем уникальные уроки по номеру урока (на случай дубликатов)
          const uniqueLessons = [];
          const seenLessons = new Set();
          scheduleRes.data.forEach(lesson => {
            if (!seenLessons.has(lesson.lesson_number)) {
              seenLessons.add(lesson.lesson_number);
              uniqueLessons.push(lesson);
            }
          });
          const todaySchedule = uniqueLessons.sort((a, b) => a.lesson_number - b.lesson_number);

          // Загружаем расписание на неделю
          const weekSchedule = [];
          for (let day = 0; day < 5; day++) {
            try {
              const daySchedule = await scheduleAPI.getStudentSchedule(studentId, {
                day_of_week: day,
              });
              weekSchedule.push({ day, lessons: daySchedule.data });
            } catch (e) {
              weekSchedule.push({ day, lessons: [] });
            }
          }

          setStats(prev => ({
            ...prev,
            recentGrades,
            allGrades: allGrades,
            subjectStats,
            upcomingHomework,
            todaySchedule,
            weekSchedule,
          }));
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const getCurrentDate = () => {
    const now = new Date();
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 
                    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    return {
      day: days[now.getDay()],
      date: now.getDate(),
      month: months[now.getMonth()],
      full: `${now.getDate()} ${months[now.getMonth()]}`
    };
  };

  const getBestSubject = () => {
    let best = null;
    let maxAvg = 0;
    Object.keys(stats.subjectStats).forEach(subjId => {
      const avg = parseFloat(stats.subjectStats[subjId].average);
      if (avg > maxAvg) {
        maxAvg = avg;
        best = subjId;
      }
    });
    return best ? subjects.find(s => s.id === best) : null;
  };

  const getWorstSubject = () => {
    let worst = null;
    let minAvg = 5;
    Object.keys(stats.subjectStats).forEach(subjId => {
      const avg = parseFloat(stats.subjectStats[subjId].average);
      if (avg < minAvg && avg > 0) {
        minAvg = avg;
        worst = subjId;
      }
    });
    return worst ? subjects.find(s => s.id === worst) : null;
  };

  const getDayName = (dayIndex) => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
    return days[dayIndex];
  };

  // Получаем оценки для графика на основе выбранного предмета и периода
  const getFilteredGrades = () => {
    if (!stats.allGrades || stats.allGrades.length === 0) {
      return [];
    }

    let filtered = selectedSubject === 'all' 
      ? [...stats.allGrades]
      : stats.allGrades.filter(grade => grade.subject_id === selectedSubject);

    // Фильтруем по периоду
    const now = new Date();
    if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(grade => new Date(grade.date) >= weekAgo);
    } else if (selectedPeriod === 'quarter') {
      // Примерно 3 месяца назад (четверть)
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(grade => new Date(grade.date) >= quarterAgo);
    }
    // Если период не выбран, берем все оценки

    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Вычисляем средний балл на основе выбранного предмета и периода
  const getFilteredAverageGrade = () => {
    const filteredGrades = getFilteredGrades();
    
    if (filteredGrades.length === 0) {
      return null;
    }
    
    const total = filteredGrades.reduce((sum, g) => sum + g.value, 0);
    const avg = total / filteredGrades.length;
    return parseFloat(avg.toFixed(1));
  };

  // Получаем распределение оценок для кругового графика
  const getGradeDistribution = () => {
    const filteredGrades = getFilteredGrades();
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    
    filteredGrades.forEach(grade => {
      if (grade.value >= 1 && grade.value <= 5) {
        distribution[grade.value]++;
      }
    });

    const total = filteredGrades.length;
    if (total === 0) return null;

    return {
      distribution,
      percentages: {
        5: (distribution[5] / total) * 100,
        4: (distribution[4] / total) * 100,
        3: (distribution[3] / total) * 100,
        2: (distribution[2] / total) * 100,
        1: (distribution[1] / total) * 100,
      },
      total
    };
  };

  if (loading) {
    return <div className="dashboard-loading">Загрузка...</div>;
  }

  const dateInfo = getCurrentDate();
  const bestSubject = getBestSubject();
  const worstSubject = getWorstSubject();
  const bestAvg = bestSubject ? parseFloat(stats.subjectStats[bestSubject.id]?.average || 0) : 0;
  const worstAvg = worstSubject ? parseFloat(stats.subjectStats[worstSubject.id]?.average || 0) : 0;
  const filteredAverageGrade = getFilteredAverageGrade();
  const filteredGrades = getFilteredGrades();

  return (
    <div className="dashboard">
      {/* Верхняя панель */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="greeting">Добрый день, {user?.full_name?.split(' ')[1] || user?.full_name}!</h1>
          <p className="header-subtitle">
            {stats.todaySchedule.length > 0 
              ? `Сегодня у вас ${stats.todaySchedule.length} ${stats.todaySchedule.length === 1 ? 'урок' : stats.todaySchedule.length < 5 ? 'урока' : 'уроков'}`
              : 'Сегодня нет уроков'}
          </p>
        </div>
        <div className="header-right">
          <div className="date-info">
            <span className="date-day">{dateInfo.date}</span>
            <div className="date-text">
              <span className="date-month">{dateInfo.month}</span>
              <span className="date-weekday">{dateInfo.day}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="stats-grid">
        <div className="stat-card stat-card-purple">
          <div className="stat-label">Средний балл</div>
          <div className="stat-value">
            {stats.averageGrade || '-'}
            {stats.averageGrade && <span className="stat-arrow">↑</span>}
          </div>
          <div className="stat-sublabel">за четверть</div>
        </div>
        
        <div className="stat-card stat-card-pink">
          <div className="stat-label">Успехи</div>
          <div className="stat-value">
            {bestAvg > 0 ? bestAvg : '-'}
            {bestAvg > 0 && <span className="stat-arrow">↑</span>}
          </div>
          <div className="stat-sublabel">{bestSubject?.name || 'Нет данных'}</div>
        </div>
        
        <div className="stat-card stat-card-blue">
          <div className="stat-label">Трудности</div>
          <div className="stat-value">
            {worstAvg > 0 ? worstAvg : '-'}
            {worstAvg > 0 && <span className="stat-arrow">↓</span>}
          </div>
          <div className="stat-sublabel">{worstSubject?.name || 'Нет данных'}</div>
        </div>
        
        <div className="stat-card stat-card-yellow">
          <div className="stat-label">Рейтинг</div>
          <div className="stat-value">-</div>
          <div className="stat-sublabel">в классе</div>
        </div>
      </div>

      {/* Основной контент - новая компоновка */}
      <div className="dashboard-content-new">
        {/* Левая часть - График и оценки */}
        <div className="dashboard-left-new">
          {/* График успеваемости */}
          <div className="dashboard-card chart-card">
            <div className="card-header">
              <h2 className="subject-title">
                {selectedSubject === 'all' 
                  ? 'Рейтинг успеваемости' 
                  : subjects.find(s => s.id === selectedSubject)?.name || 'Рейтинг успеваемости'}
              </h2>
              <select 
                className="subject-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="all">Все предметы</option>
                {subjects
                  .filter(subj => subj.name !== "Белорусский язык")
                  .map(subj => (
                    <option key={subj.id} value={subj.id}>{subj.name}</option>
                  ))}
              </select>
            </div>

            {/* Домашнее задание */}
            {selectedSubject !== 'all' && stats.upcomingHomework.length > 0 && (() => {
              const subjectHomework = stats.upcomingHomework.find(hw => {
                const hwSubject = subjects.find(s => s.id === hw.subject_id);
                return hwSubject?.id === selectedSubject;
              });
              return subjectHomework ? (
                <div className="homework-section">
                  <div className="homework-label">Домашнее задание:</div>
                  <div className="homework-text">{subjectHomework.title}</div>
                </div>
              ) : null;
            })()}

            {/* Навигация по периодам */}
            <div className="period-tabs">
              <button 
                className={`period-tab ${selectedPeriod === 'week' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('week')}
              >
                Неделя
              </button>
              <button 
                className={`period-tab ${selectedPeriod === 'quarter' ? 'active' : ''}`}
                onClick={() => setSelectedPeriod('quarter')}
              >
                Четверть
              </button>
            </div>

            {filteredAverageGrade !== null && filteredAverageGrade !== undefined && filteredGrades.length > 0 ? (
              <div className="rating-content">
                {/* Левая часть: Круговой график, легенда и средний балл */}
                <div className="chart-section-left">
                  <DoughnutChart distribution={getGradeDistribution()} />
                  <div className="chart-info-wrapper">
                    <div className="chart-legend">
                      <div className="legend-item">
                        <span className="legend-dot legend-green"></span>
                        <span>5</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot legend-yellow"></span>
                        <span>4</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot legend-orange"></span>
                        <span>3</span>
                      </div>
                      <div className="legend-item">
                        <span className="legend-dot legend-red"></span>
                        <span>2</span>
                      </div>
                    </div>
                    <div className="average-score-compact">
                      <div className="average-score-label-compact">Средний балл</div>
                      <div className="average-score-value-compact">
                        {typeof filteredAverageGrade === 'number' ? filteredAverageGrade.toFixed(1) : filteredAverageGrade}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Правая часть: Линейный график */}
                <div className="chart-section-right">
                  <div className="line-chart-title">Оценки</div>
                  <LineChart grades={filteredGrades} />
                </div>
              </div>
            ) : (
              <div className="chart-info">
                <div className="chart-no-data">Нет данных</div>
                <div className="chart-label">Средний балл</div>
              </div>
            )}
          </div>

          {/* Последние оценки */}
          <div className="dashboard-card grades-card">
            <h2>Последние оценки</h2>
            {stats.recentGrades.length > 0 ? (
              <div className="grades-table">
                {stats.recentGrades.map((grade) => {
                  const subject = subjects.find(s => s.id === grade.subject_id);
                  return (
                    <div key={grade.id} className="grade-row">
                      <span className="grade-subject">{subject?.name || grade.subject_id}</span>
                      <span className={`grade-value grade-${grade.value}`}>{grade.value}</span>
                      <span className="grade-date">
                        {new Date(grade.date).toLocaleDateString('ru-RU', { 
                          day: '2-digit', 
                          month: '2-digit' 
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">Нет оценок</p>
            )}
          </div>
        </div>

        {/* Правая часть - События и расписание */}
        <div className="dashboard-right-new">
          {/* Предстоящие события */}
          <div className="dashboard-card events-card">
            <h2>Предстоящие события</h2>
            {stats.upcomingHomework.length > 0 ? (
              <div className="events-list">
                {stats.upcomingHomework.map((hw) => {
                  const dueDate = new Date(hw.due_date);
                  const isSoon = dueDate.getTime() - new Date().getTime() < 2 * 24 * 60 * 60 * 1000;
                  return (
                    <div key={hw.id} className={`event-item ${isSoon ? 'soon' : ''}`}>
                      <div className="event-date">
                        {dueDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                      </div>
                      <div className="event-content">
                        <div className="event-title">{hw.title}</div>
                        <div className="event-subtitle">Домашнее задание</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">Нет предстоящих событий</p>
            )}
          </div>

          {/* Расписание на неделю - таблица */}
          <div className="dashboard-card schedule-card">
            <h2>Расписание на неделю</h2>
            {stats.weekSchedule && stats.weekSchedule.length > 0 ? (
              <div className="week-schedule-table-wrapper">
                <table className="week-schedule-table">
                  <thead>
                    <tr>
                      <th className="schedule-th schedule-lesson-th">Урок</th>
                      {stats.weekSchedule.map((dayData, idx) => (
                        <th key={idx} className="schedule-th">
                          {getDayName(dayData.day)}
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
                        {stats.weekSchedule.map((dayData, dayIdx) => {
                          const lesson = dayData.lessons
                            .sort((a, b) => a.lesson_number - b.lesson_number)
                            .find(l => l.lesson_number === lessonNum + 1);
                          const subject = lesson ? subjects.find(s => s.id === lesson.subject_id) : null;
                          return (
                            <td key={dayIdx} className="schedule-td">
                              {subject ? (
                                <div className="schedule-lesson">
                                  <span className="schedule-lesson-name">{subject.name}</span>
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
              </div>
            ) : (
              <p className="empty-state">Нет расписания</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import axios from 'axios';

// URL API: берётся из window.__ENV__.API_URL (задаётся в Dokploy Environment Settings)
// Если пусто — fallback на /api (тот же хост) или localhost для разработки
function getApiUrl() {
  const envUrl = typeof window !== 'undefined' && window.__ENV__ && window.__ENV__.API_URL;
  if (envUrl && envUrl.trim() !== '') return envUrl.trim();
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin + '/api';
  }
  return 'http://localhost:8000/api';
}

const API_BASE_URL = getApiUrl();

// Создание экземпляра axios с базовой конфигурацией
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API методы для авторизации
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getMe: () => api.get('/auth/me'),
};

// API методы для пользователей
export const usersAPI = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.patch(`/users/${id}`, data),
  toggleBan: (id) => api.patch(`/users/${id}/ban`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getAdminStats: () => api.get('/users/admin/stats'),
  getClassStudents: (classId) => api.get(`/classes/${classId}/students`),
};

// API методы для классов
export const classesAPI = {
  getClasses: () => api.get('/classes'),
  getClass: (id) => api.get(`/classes/${id}`),
  createClass: (classData) => api.post('/classes', classData),
};

// API методы для предметов
export const subjectsAPI = {
  getSubjects: () => api.get('/subjects'),
  getSubject: (id) => api.get(`/subjects/${id}`),
  createSubject: (subjectData) => api.post('/subjects', subjectData),
};

// API методы для оценок
export const gradesAPI = {
  getStudentGrades: (studentId, params = {}) =>
    api.get(`/grades/student/${studentId}`, { params }),
  getGrade: (id) => api.get(`/grades/${id}`),
  createGrade: (gradeData) => api.post('/grades', gradeData),
  updateGrade: (id, data) => api.put(`/grades/${id}`, data),
  deleteGrade: (id) => api.delete(`/grades/${id}`),
  getClassGrades: (classId, subjectId) =>
    api.get(`/grades/class/${classId}/subject/${subjectId}`),
};

// API методы для домашних заданий
export const homeworkAPI = {
  getClassHomework: (classId, params = {}) => 
    api.get(`/homework/class/${classId}`, { params }),
  getStudentHomework: (studentId) => 
    api.get(`/homework/student/${studentId}`),
  getHomework: (id) => api.get(`/homework/${id}`),
  createHomework: (homeworkData) => api.post('/homework', homeworkData),
};

// API методы для расписания
export const scheduleAPI = {
  getClassSchedule: (classId, params = {}) =>
    api.get(`/schedule/class/${classId}`, { params }),
  getStudentSchedule: (studentId, params = {}) =>
    api.get(`/schedule/student/${studentId}`, { params }),
  getTeacherSchedule: (teacherId, params = {}) =>
    api.get(`/schedule/teacher/${teacherId}`, { params }),
  createSchedule: (scheduleData) => api.post('/schedule', scheduleData),
};

export default api;

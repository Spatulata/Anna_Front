import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI, classesAPI, subjectsAPI } from '../api/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newClassForm, setNewClassForm] = useState({ grade: '', letter: '' });
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '', email: '', full_name: '', role: 'student',
    password: '', class_id: '', child_ids: '', subject_ids: [], user_type: 'admin'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, classesRes, subjectsRes] = await Promise.all([
          usersAPI.getUsers(),
          classesAPI.getClasses(),
          subjectsAPI.getSubjects()
        ]);
        setAllUsers(usersRes.data || []);
        setClasses(classesRes.data || []);
        setSubjects(subjectsRes.data || []);

        try {
          const statsRes = await usersAPI.getAdminStats();
          setStats(statsRes.data);
        } catch (e) {
          console.warn('Не удалось загрузить статистику:', e);
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleDelete = async (userId, username) => {
    if (!window.confirm(`Удалить пользователя "${username}"?`)) return;
    try {
      await usersAPI.deleteUser(userId);
      setAllUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось удалить'));
    }
  };

  const handleEdit = (userItem) => {
    setEditingUser(userItem);
    setEditForm({
      full_name: userItem.full_name,
      email: userItem.email,
      role: userItem.role,
      user_type: userItem.user_type || 'admin',
      subject_ids: userItem.subject_ids || [],
      class_id: userItem.class_id || '',
      child_id: userItem.child_ids?.[0] || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const payload = {
        ...editForm,
        subject_ids: Array.isArray(editForm.subject_ids) ? editForm.subject_ids : undefined,
        child_ids: editForm.child_id ? [editForm.child_id] : [],
      };
      const res = await usersAPI.updateUser(editingUser.id, payload);
      setAllUsers(prev => prev.map(u => u.id === editingUser.id ? res.data : u));
      setEditingUser(null);
      setEditForm({});
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось обновить'));
    }
  };

  const handleCreateUser = async () => {
    if (!createForm.username || !createForm.email || !createForm.full_name || !createForm.password) {
      window.alert('Заполните все обязательные поля');
      return;
    }
    try {
      const payload = {
        username: createForm.username,
        email: createForm.email,
        full_name: createForm.full_name,
        role: createForm.role,
        password: createForm.password,
        class_id: createForm.class_id || undefined,
        child_ids: createForm.child_ids ? [createForm.child_ids] : undefined,
        subject_ids: Array.isArray(createForm.subject_ids) && createForm.subject_ids.length > 0
          ? createForm.subject_ids
          : undefined,
        user_type: createForm.role === 'admin' ? createForm.user_type : undefined,
      };
      const res = await usersAPI.createUser(payload);
      setAllUsers(prev => [...prev, res.data]);
      setShowCreateModal(false);
      setCreateForm({ username: '', email: '', full_name: '', role: 'student', password: '', class_id: '', child_ids: '', subject_ids: [], user_type: 'admin' });
      if (stats) {
        setStats(prev => ({ ...prev, total_users: prev.total_users + 1 }));
      }
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось создать'));
    }
  };

  const handleCreateSubject = async () => {
    if (!newSubjectName.trim()) return;
    try {
      const res = await subjectsAPI.createSubject({ name: newSubjectName.trim() });
      setSubjects(prev => [...prev, res.data]);
      setNewSubjectName('');
      setShowSubjectModal(false);
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось добавить предмет'));
    }
  };

  const handleCreateClass = async () => {
    if (!newClassForm.grade || !newClassForm.letter) return;
    try {
      const classLabel = `${newClassForm.grade}${newClassForm.letter.toUpperCase()}`;
      const payload = {
        name: classLabel,
        grade: Number(newClassForm.grade),
        letter: newClassForm.letter,
      };
      const res = await classesAPI.createClass(payload);
      setClasses(prev => [...prev, res.data]);
      setNewClassForm({ grade: '', letter: '' });
      setShowClassModal(false);
    } catch (error) {
      window.alert('Ошибка: ' + (error.response?.data?.detail || 'Не удалось добавить класс'));
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchRole = filterRole === 'all' || u.role === filterRole;
    const matchSearch = searchQuery === '' ||
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  const getRoleBadge = (role) => {
    const map = {
      admin: { label: 'Админ', color: '#e74c3c' },
      teacher: { label: 'Учитель', color: '#3498db' },
      student: { label: 'Ученик', color: '#27ae60' },
      parent: { label: 'Родитель', color: '#f39c12' },
    };
    const r = map[role] || { label: role, color: '#95a5a6' };
    return <span className="role-badge" style={{ backgroundColor: r.color }}>{r.label}</span>;
  };

  const getClassName = (classId) => {
    if (!classId) return '—';
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.grade}${cls.letter}` : classId;
  };

  const roleLabels = { all: 'Все', admin: 'Админы', teacher: 'Учителя', student: 'Ученики', parent: 'Родители' };
  const students = allUsers.filter((u) => u.role === 'student');

  if (loading) return <div className="admin-loading">Загрузка...</div>;

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Администрирование</h1>
        <p className="admin-subtitle">Управление пользователями и системой</p>
      </div>

      {stats && (
        <div className="admin-stats-grid">
          <div className="admin-stat-card stat-total">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-number">{stats.total_users}</div>
              <div className="stat-label">Всего</div>
            </div>
          </div>
          <div className="admin-stat-card stat-admins">
            <div className="stat-icon">🛡️</div>
            <div className="stat-info">
              <div className="stat-number">{stats.admins}</div>
              <div className="stat-label">Админы</div>
            </div>
          </div>
          <div className="admin-stat-card stat-teachers">
            <div className="stat-icon">👨‍🏫</div>
            <div className="stat-info">
              <div className="stat-number">{stats.teachers}</div>
              <div className="stat-label">Учителя</div>
            </div>
          </div>
          <div className="admin-stat-card stat-students">
            <div className="stat-icon">🎓</div>
            <div className="stat-info">
              <div className="stat-number">{stats.students}</div>
              <div className="stat-label">Ученики</div>
            </div>
          </div>
          <div className="admin-stat-card stat-parents">
            <div className="stat-icon">👪</div>
            <div className="stat-info">
              <div className="stat-number">{stats.parents}</div>
              <div className="stat-label">Родители</div>
            </div>
          </div>
          <div className="admin-stat-card stat-classes">
            <div className="stat-icon">🏫</div>
            <div className="stat-info">
              <div className="stat-number">{stats.classes}</div>
              <div className="stat-label">Классы</div>
            </div>
          </div>
          <div className="admin-stat-card stat-subjects">
            <div className="stat-icon">📚</div>
            <div className="stat-info">
              <div className="stat-number">{stats.subjects}</div>
              <div className="stat-label">Предметы</div>
            </div>
          </div>
          <div className="admin-stat-card stat-grades">
            <div className="stat-icon">📝</div>
            <div className="stat-info">
              <div className="stat-number">{stats.grades}</div>
              <div className="stat-label">Оценки</div>
            </div>
          </div>
        </div>
      )}

      <div className="admin-filters">
        <div className="filter-tabs">
          {Object.entries(roleLabels).map(([key, label]) => (
            <button key={key} className={`filter-tab ${filterRole === key ? 'active' : ''}`}
              onClick={() => setFilterRole(key)}>{label}</button>
          ))}
        </div>
        <input type="text" className="search-input" placeholder="Поиск..."
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        <button className="btn-create-user" onClick={() => setShowCreateModal(true)}>+ Пользователь</button>
        <button className="btn-create-user" onClick={() => setShowSubjectModal(true)}>+ Предмет</button>
        <button className="btn-create-user" onClick={() => setShowClassModal(true)}>+ Класс</button>
      </div>

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Пользователь</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Класс</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <div className="user-avatar">{u.full_name?.[0] || '?'}</div>
                    <div className="user-info">
                      <div className="user-name">{u.full_name}</div>
                      <div className="user-username">@{u.username}</div>
                    </div>
                  </div>
                </td>
                <td className="email-cell">{u.email}</td>
                <td>{getRoleBadge(u.role)}</td>
                <td>{getClassName(u.class_id)}</td>
                <td className="actions-cell">
                  <button className="action-btn btn-edit" onClick={() => handleEdit(u)} title="Редактировать">✏️</button>
                  {u.id !== user?.id && u.user_type !== 'super_admin' && (
                    <button className="action-btn btn-delete" onClick={() => handleDelete(u.id, u.username)} title="Удалить">🗑️</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredUsers.length === 0 && <div className="no-results">Не найдено</div>}
      </div>

      {/* Модалка редактирования */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Редактирование</h2>
              <button className="modal-close" onClick={() => setEditingUser(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Полное имя</label>
                <input type="text" value={editForm.full_name || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={editForm.email || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Роль</label>
                <select value={editForm.role || ''}
                  onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}>
                  <option value="student">Ученик</option>
                  <option value="teacher">Учитель</option>
                  <option value="parent">Родитель</option>
                  <option value="admin">Администратор</option>
                </select>
              </div>
              {editForm.role === 'student' && (
                <div className="form-group">
                  <label>Класс</label>
                  <select value={editForm.class_id || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, class_id: e.target.value }))}>
                    <option value="">Не выбран</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.grade}{c.letter}</option>)}
                  </select>
                </div>
              )}
              {editForm.role === 'teacher' && (
                <>
                  <div className="form-group">
                    <label>Предметы</label>
                    <select
                      multiple
                      value={editForm.subject_ids || []}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                        setEditForm(prev => ({ ...prev, subject_ids: selected }));
                      }}
                    >
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Класс</label>
                    <select value={editForm.class_id || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, class_id: e.target.value }))}>
                      <option value="">Не выбран</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.grade}{c.letter}</option>)}
                    </select>
                  </div>
                </>
              )}
              {editForm.role === 'parent' && (
                <div className="form-group">
                  <label>Ребенок</label>
                  <select value={editForm.child_id || ''} onChange={(e) => setEditForm(prev => ({ ...prev, child_id: e.target.value }))}>
                    <option value="">Не выбран</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                </div>
              )}
              {editForm.role === 'admin' && (
                <div className="form-group">
                  <label>Тип администратора</label>
                  <select value={editForm.user_type || 'admin'}
                    onChange={(e) => setEditForm(prev => ({ ...prev, user_type: e.target.value }))}>
                    <option value="admin">admin</option>
                    <option value="super_admin">super_admin</option>
                  </select>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setEditingUser(null)}>Отмена</button>
              <button className="btn-save" onClick={handleSaveEdit}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка создания */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Новый пользователь</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row class-form-row">
                <div className="form-group">
                  <label>Логин *</label>
                  <input type="text" value={createForm.username}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))} placeholder="ivanov_i" />
                </div>
                <div className="form-group">
                  <label>Полное имя *</label>
                  <input type="text" value={createForm.full_name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Иванов Иван Иванович" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))} placeholder="ivanov@school.ru" />
                </div>
                <div className="form-group">
                  <label>Пароль *</label>
                  <input type="text" value={createForm.password}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))} placeholder="Минимум 6 символов" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Роль</label>
                  <select value={createForm.role}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}>
                    <option value="student">Ученик</option>
                    <option value="teacher">Учитель</option>
                    <option value="parent">Родитель</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>
                {createForm.role === 'student' && (
                  <div className="form-group">
                    <label>Класс</label>
                    <select value={createForm.class_id}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, class_id: e.target.value }))}>
                      <option value="">Не выбран</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.grade}{c.letter}</option>)}
                    </select>
                  </div>
                )}
                {createForm.role === 'parent' && (
                  <div className="form-group">
                    <label>Ребенок</label>
                    <select value={createForm.child_ids}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, child_ids: e.target.value }))}>
                      <option value="">Не выбран</option>
                      {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                  </div>
                )}
                {createForm.role === 'teacher' && (
                  <>
                    <div className="form-group">
                      <label>Предметы</label>
                      <select
                        multiple
                        value={createForm.subject_ids || []}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                          setCreateForm(prev => ({ ...prev, subject_ids: selected }));
                        }}
                      >
                        {subjects.map((subject) => (
                          <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Класс</label>
                      <select value={createForm.class_id}
                        onChange={(e) => setCreateForm(prev => ({ ...prev, class_id: e.target.value }))}>
                        <option value="">Не выбран</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.grade}{c.letter}</option>)}
                      </select>
                    </div>
                  </>
                )}
                {createForm.role === 'admin' && (
                  <div className="form-group">
                    <label>Тип администратора</label>
                    <select value={createForm.user_type}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, user_type: e.target.value }))}>
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Отмена</button>
              <button className="btn-save" onClick={handleCreateUser}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {showSubjectModal && (
        <div className="modal-overlay" onClick={() => setShowSubjectModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Новый предмет</h2>
              <button className="modal-close" onClick={() => setShowSubjectModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Название предмета</label>
                <input type="text" value={newSubjectName} onChange={(e) => setNewSubjectName(e.target.value)} placeholder="Например: География" />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowSubjectModal(false)}>Отмена</button>
              <button className="btn-save" onClick={handleCreateSubject}>Создать</button>
            </div>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="modal-overlay" onClick={() => setShowClassModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Новый класс</h2>
              <button className="modal-close" onClick={() => setShowClassModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Номер класса</label>
                  <input type="number" min="1" max="11" value={newClassForm.grade} onChange={(e) => setNewClassForm(prev => ({ ...prev, grade: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Буква</label>
                  <input type="text" maxLength="1" value={newClassForm.letter} onChange={(e) => setNewClassForm(prev => ({ ...prev, letter: e.target.value.toUpperCase() }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setShowClassModal(false)}>Отмена</button>
              <button className="btn-save" onClick={handleCreateClass}>Создать</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

# Коллекции MongoDB для электронного дневника

## 📋 Список коллекций

Система использует **6 коллекций**. Они создаются **автоматически** при первом запуске приложения или выполнении скрипта `seed_data.py`.

### 1. **users** - Пользователи системы
Хранит всех пользователей: учеников, учителей, родителей и администраторов.

**Структура документа:**
```json
{
  "_id": ObjectId,
  "username": "student1",
  "email": "student1@school.ru",
  "full_name": "Петров Петр Петрович",
  "role": "student",  // student, teacher, parent, admin
  "hashed_password": "$2b$12$...",
  "class_id": "ObjectId",  // для учеников
  "child_ids": ["ObjectId"],  // для родителей (ID детей)
  "created_at": ISODate
}
```

**Индексы:**
- `email` (unique)
- `username` (unique)

---

### 2. **classes** - Классы
Хранит информацию о школьных классах.

**Структура документа:**
```json
{
  "_id": ObjectId,
  "name": "5А",
  "grade": 5,  // номер класса (1-11)
  "letter": "А",  // буква класса
  "students": ["ObjectId"],  // массив ID учеников
  "teachers": ["ObjectId"],  // массив ID учителей
  "created_at": ISODate
}
```

---

### 3. **subjects** - Предметы
Хранит учебные предметы.

**Структура документа:**
```json
{
  "_id": ObjectId,
  "name": "Математика",
  "description": "Алгебра и геометрия",
  "created_at": ISODate
}
```

---

### 4. **grades** - Оценки
Хранит оценки учеников по предметам.

**Структура документа:**
```json
{
  "_id": ObjectId,
  "student_id": "ObjectId",
  "subject_id": "ObjectId",
  "teacher_id": "ObjectId",
  "value": 5,  // оценка от 1 до 5
  "date": "2024-02-17",  // ISO формат даты
  "comment": "Отлично выполненная работа",
  "created_at": ISODate
}
```

**Индексы:**
- `(student_id, date)` - для быстрого поиска оценок ученика

---

### 5. **homework** - Домашние задания
Хранит домашние задания для классов.

**Структура документа:**
```json
{
  "_id": ObjectId,
  "class_id": "ObjectId",
  "subject_id": "ObjectId",
  "teacher_id": "ObjectId",
  "title": "Решение задач по алгебре",
  "description": "Решить задачи из учебника: стр. 45, № 1-10",
  "due_date": "2024-02-20",  // ISO формат даты
  "created_at": ISODate
}
```

**Индексы:**
- `(class_id, date)` - для быстрого поиска заданий класса

---

### 6. **schedule** - Расписание уроков
Хранит расписание уроков для классов.

**Структура документа:**
```json
{
  "_id": ObjectId,
  "class_id": "ObjectId",
  "subject_id": "ObjectId",
  "teacher_id": "ObjectId",
  "day_of_week": 0,  // 0 = понедельник, 6 = воскресенье
  "lesson_number": 1,  // номер урока (1-8)
  "room": "101",  // номер кабинета
  "created_at": ISODate
}
```

**Индексы:**
- `(class_id, day_of_week)` - для быстрого поиска расписания класса

---

## 🚀 Как создать коллекции

### Вариант 1: Автоматическое создание (рекомендуется)
Коллекции создаются автоматически при:
- Первом запуске приложения (`python run.py`)
- Выполнении скрипта инициализации (`python seed_data.py`)

**Ничего делать не нужно!** Просто запустите приложение или скрипт.

### Вариант 2: Ручное создание через MongoDB Compass/CLI
Если вы хотите создать коллекции вручную, используйте следующие команды:

```javascript
// В MongoDB Compass или MongoDB Shell

use diary_db  // или ваше имя базы данных

// Коллекции создаются автоматически при первой вставке документа
// Но можно создать пустые коллекции:

db.createCollection("users")
db.createCollection("classes")
db.createCollection("subjects")
db.createCollection("grades")
db.createCollection("homework")
db.createCollection("schedule")
```

---

## 📝 Важные замечания

1. **Коллекции создаются автоматически** - вам не нужно создавать их вручную
2. **Индексы создаются автоматически** при запуске приложения (см. `app/database.py`)
3. **Данные не заполняются автоматически** - используйте `seed_data.py` для начальных данных
4. **Имя базы данных** можно изменить в файле `.env` (параметр `DATABASE_NAME`)

---

## ✅ Проверка коллекций

После запуска приложения или скрипта `seed_data.py`, вы можете проверить созданные коллекции:

```javascript
// В MongoDB Compass или MongoDB Shell
use diary_db
show collections
```

Вы должны увидеть:
- users
- classes
- subjects
- grades
- homework
- schedule

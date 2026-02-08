# 🚀 Быстрая настройка Supabase для BE CEO

## Шаг 1: Открой Supabase SQL Editor

1. Зайди на https://app.supabase.com/
2. Выбери свой проект
3. Слева в меню найди **SQL Editor** (иконка с кодом)
4. Нажми **New Query**

## Шаг 2: Скопируй и вставь SQL код

⚠️ **ВАЖНО:** Этот код удалит старые таблицы (если есть) и создаст новые!

Скопируй **ВЕСЬ** код ниже (Ctrl+A в этом блоке, потом Ctrl+C):

```sql
-- BE CEO Database Schema для Supabase

-- УДАЛЯЕМ СТАРЫЕ ТАБЛИЦЫ (если есть)
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS traces CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Удаляем старые функции
DROP FUNCTION IF EXISTS update_trace_likes() CASCADE;
DROP FUNCTION IF EXISTS get_stats() CASCADE;

-- Таблица пользователей
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица следов (постов)
CREATE TABLE traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица лайков
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  trace_id UUID REFERENCES traces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trace_id)
);

-- Индексы для производительности
CREATE INDEX idx_traces_created_at ON traces(created_at DESC);
CREATE INDEX idx_traces_likes ON traces(likes DESC);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_trace_id ON likes(trace_id);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_username ON users(username);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "Все могут читать пользователей"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Пользователи могут создавать свои данные"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Пользователи могут обновлять свои данные"
  ON users FOR UPDATE
  USING (true);

-- Политики для traces
CREATE POLICY "Все могут читать следы"
  ON traces FOR SELECT
  USING (true);

CREATE POLICY "Все могут создавать следы"
  ON traces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Админы могут удалять любые следы"
  ON traces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.is_admin = true
    )
  );

-- Политики для likes
CREATE POLICY "Все могут читать лайки"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Все могут ставить лайки"
  ON likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Все могут удалять лайки"
  ON likes FOR DELETE
  USING (true);

-- Функция для обновления счетчика лайков
CREATE OR REPLACE FUNCTION update_trace_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE traces SET likes = likes + 1 WHERE id = NEW.trace_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE traces SET likes = likes - 1 WHERE id = OLD.trace_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления лайков
DROP TRIGGER IF EXISTS trace_likes_trigger ON likes;
CREATE TRIGGER trace_likes_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_trace_likes();

-- Функция для получения статистики
CREATE OR REPLACE FUNCTION get_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'total_traces', (SELECT COUNT(*) FROM traces),
    'total_likes', (SELECT SUM(likes) FROM traces),
    'banned_users', (SELECT COUNT(*) FROM users WHERE is_banned = true)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

## Шаг 3: Запусти SQL

1. Вставь скопированный код в SQL Editor (Ctrl+V)
2. Нажми **Run** (или F5)
3. Дождись сообщения "Success. No rows returned"

✅ Готово! Таблицы созданы!

## Шаг 4: Настрой admin.html

1. Открой файл **`admin.html`**
2. Найди строки (в самом начале `<script>`):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

3. Замени на свои данные:
   - Открой Supabase Dashboard
   - Перейди в **Project Settings** (шестеренка слева внизу)
   - Открой вкладку **API**
   - Скопируй **Project URL** → вставь вместо `YOUR_SUPABASE_URL`
   - Скопируй **anon public** ключ → вставь вместо `YOUR_SUPABASE_ANON_KEY`

Пример:
```javascript
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## Шаг 5: Открой админ-панель

Просто открой `admin.html` в браузере!

Если всё настроено правильно, увидишь статистику (пока 0 везде).

---

## ⚠️ Важно!

Сейчас админ-панель работает, но **основной сайт всё ещё использует localStorage**.

Чтобы управлять постами, нужно интегрировать Supabase в основной сайт.

**Скажи мне "интегрируй Supabase"** и я это сделаю! 🚀

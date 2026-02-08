-- BE CEO Database Schema для Supabase
-- БЕЗОПАСНАЯ ВЕРСИЯ: использует уникальные имена таблиц

-- УДАЛЯЕМ СТАРЫЕ ТАБЛИЦЫ BE CEO (если есть)
DROP TABLE IF EXISTS beceo_likes CASCADE;
DROP TABLE IF EXISTS beceo_traces CASCADE;
DROP TABLE IF EXISTS beceo_users CASCADE;

-- Удаляем старые функции BE CEO
DROP FUNCTION IF EXISTS beceo_update_trace_likes() CASCADE;
DROP FUNCTION IF EXISTS beceo_get_stats() CASCADE;

-- Таблица пользователей BE CEO
CREATE TABLE beceo_users (
  id TEXT PRIMARY KEY,
  google_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица следов (постов) BE CEO
CREATE TABLE beceo_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES beceo_users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица лайков BE CEO
CREATE TABLE beceo_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES beceo_users(id) ON DELETE CASCADE,
  trace_id UUID REFERENCES beceo_traces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trace_id)
);

-- Индексы для производительности
CREATE INDEX idx_beceo_traces_created_at ON beceo_traces(created_at DESC);
CREATE INDEX idx_beceo_traces_likes ON beceo_traces(likes DESC);
CREATE INDEX idx_beceo_likes_user_id ON beceo_likes(user_id);
CREATE INDEX idx_beceo_likes_trace_id ON beceo_likes(trace_id);
CREATE INDEX idx_beceo_users_google_id ON beceo_users(google_id);
CREATE INDEX idx_beceo_users_username ON beceo_users(username);

-- Row Level Security (RLS)
ALTER TABLE beceo_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE beceo_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE beceo_likes ENABLE ROW LEVEL SECURITY;

-- Политики для beceo_users
CREATE POLICY "Все могут читать пользователей BE CEO"
  ON beceo_users FOR SELECT
  USING (true);

CREATE POLICY "Пользователи могут создавать свои данные BE CEO"
  ON beceo_users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Пользователи могут обновлять свои данные BE CEO"
  ON beceo_users FOR UPDATE
  USING (true);

-- Политики для beceo_traces
CREATE POLICY "Все могут читать следы BE CEO"
  ON beceo_traces FOR SELECT
  USING (true);

CREATE POLICY "Все могут создавать следы BE CEO"
  ON beceo_traces FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Админы могут удалять любые следы BE CEO"
  ON beceo_traces FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM beceo_users
      WHERE beceo_users.is_admin = true
    )
  );

-- Политики для beceo_likes
CREATE POLICY "Все могут читать лайки BE CEO"
  ON beceo_likes FOR SELECT
  USING (true);

CREATE POLICY "Все могут ставить лайки BE CEO"
  ON beceo_likes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Все могут удалять лайки BE CEO"
  ON beceo_likes FOR DELETE
  USING (true);

-- Функция для обновления счетчика лайков BE CEO
CREATE OR REPLACE FUNCTION beceo_update_trace_likes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE beceo_traces SET likes = likes + 1 WHERE id = NEW.trace_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE beceo_traces SET likes = likes - 1 WHERE id = OLD.trace_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления лайков BE CEO
DROP TRIGGER IF EXISTS beceo_trace_likes_trigger ON beceo_likes;
CREATE TRIGGER beceo_trace_likes_trigger
  AFTER INSERT OR DELETE ON beceo_likes
  FOR EACH ROW
  EXECUTE FUNCTION beceo_update_trace_likes();

-- Функция для получения статистики BE CEO
CREATE OR REPLACE FUNCTION beceo_get_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM beceo_users),
    'total_traces', (SELECT COUNT(*) FROM beceo_traces),
    'total_likes', (SELECT SUM(likes) FROM beceo_traces),
    'banned_users', (SELECT COUNT(*) FROM beceo_users WHERE is_banned = true)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

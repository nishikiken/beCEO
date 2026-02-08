-- BE CEO Database Schema для Supabase

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица лайков
CREATE TABLE IF NOT EXISTS likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  trace_id UUID REFERENCES traces(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, trace_id)
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_traces_created_at ON traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_traces_likes ON traces(likes DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_trace_id ON likes(trace_id);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

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

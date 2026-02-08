-- ОТКАТ: Удаление всех таблиц BE CEO из Supabase
-- Используй этот SQL если хочешь полностью удалить все данные BE CEO

-- ВНИМАНИЕ: Это удалит ВСЕ данные BE CEO (пользователей, посты, лайки)!
-- Другие проекты НЕ ЗАТРОНУТЫ (используем префикс beceo_*)

-- Удаляем таблицы
DROP TABLE IF EXISTS beceo_likes CASCADE;
DROP TABLE IF EXISTS beceo_traces CASCADE;
DROP TABLE IF EXISTS beceo_users CASCADE;

-- Удаляем функции
DROP FUNCTION IF EXISTS beceo_update_trace_likes() CASCADE;
DROP FUNCTION IF EXISTS beceo_get_stats() CASCADE;

-- Готово! Все таблицы BE CEO удалены.
-- Чтобы создать их заново, запусти supabase_setup.sql

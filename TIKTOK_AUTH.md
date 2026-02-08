# Интеграция авторизации через TikTok

## 📋 Что нужно для интеграции

### 1. Регистрация приложения в TikTok Developer Portal

1. Перейди на [TikTok for Developers](https://developers.tiktok.com/)
2. Создай аккаунт разработчика
3. Создай новое приложение (App)
4. Получи **Client Key** и **Client Secret**

### 2. Настройка OAuth 2.0

В настройках приложения укажи:
- **Redirect URI**: `https://твой-домен.com/callback` (или `http://localhost:8000/callback` для тестов)
- **Scopes** (разрешения):
  - `user.info.basic` - базовая информация (username, avatar)
  - `user.info.profile` - расширенная информация

## 🔧 Варианты реализации

### Вариант 1: Через Backend (рекомендуется)

Нужен сервер (Node.js, Python, PHP) для безопасного хранения Client Secret.

#### Структура:
```
Frontend (HTML/JS) → Backend API → TikTok OAuth → Backend → Frontend
```

#### Пример на Node.js + Express:

```javascript
// server.js
const express = require('express');
const axios = require('axios');
const app = express();

const CLIENT_KEY = 'твой_client_key';
const CLIENT_SECRET = 'твой_client_secret';
const REDIRECT_URI = 'http://localhost:3000/callback';

// Шаг 1: Перенаправление на TikTok
app.get('/auth/tiktok', (req, res) => {
  const authUrl = `https://www.tiktok.com/v2/auth/authorize/` +
    `?client_key=${CLIENT_KEY}` +
    `&scope=user.info.basic,user.info.profile` +
    `&response_type=code` +
    `&redirect_uri=${REDIRECT_URI}`;
  
  res.redirect(authUrl);
});

// Шаг 2: Обработка callback
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    // Обмен code на access_token
    const tokenResponse = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', {
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    });
    
    const { access_token } = tokenResponse.data;
    
    // Получение данных пользователя
    const userResponse = await axios.get('https://open.tiktokapis.com/v2/user/info/', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      },
      params: {
        fields: 'open_id,union_id,avatar_url,display_name'
      }
    });
    
    const user = userResponse.data.data.user;
    
    // Сохраняем пользователя в БД и создаём сессию
    // ...
    
    res.redirect('/?auth=success');
  } catch (error) {
    console.error('Auth error:', error);
    res.redirect('/?auth=error');
  }
});

app.listen(3000);
```

### Вариант 2: Через Supabase Edge Functions

Используй Supabase для backend без своего сервера.

```typescript
// supabase/functions/tiktok-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { code } = await req.json()
  
  // Обмен code на token
  const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_key: Deno.env.get('TIKTOK_CLIENT_KEY'),
      client_secret: Deno.env.get('TIKTOK_CLIENT_SECRET'),
      code: code,
      grant_type: 'authorization_code'
    })
  })
  
  const { access_token } = await tokenResponse.json()
  
  // Получение данных пользователя
  const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
    headers: { 'Authorization': `Bearer ${access_token}` }
  })
  
  const userData = await userResponse.json()
  
  return new Response(JSON.stringify(userData), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

### Вариант 3: Через Firebase Authentication

Firebase поддерживает кастомные OAuth провайдеры.

```javascript
// firebase-config.js
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, OAuthProvider } from 'firebase/auth';

const firebaseConfig = { /* твой конфиг */ };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Создаём провайдер TikTok
const provider = new OAuthProvider('oidc.tiktok');
provider.addScope('user.info.basic');

// Авторизация
async function loginWithTikTok() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('User:', user);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## 🔄 Обновление app.js

После настройки backend, обнови функцию `loginWithTikTok()`:

```javascript
// app.js
async function loginWithTikTok() {
  try {
    // Вариант 1: Через свой backend
    window.location.href = 'http://localhost:3000/auth/tiktok';
    
    // Вариант 2: Через Supabase Edge Function
    // const { data } = await supabase.functions.invoke('tiktok-auth');
    
    // Вариант 3: Через Firebase
    // await signInWithPopup(auth, tiktokProvider);
    
  } catch (error) {
    console.error('TikTok auth error:', error);
    notify('❌ Ошибка авторизации через TikTok');
  }
}

// Обработка callback после редиректа
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  if (urlParams.get('auth') === 'success') {
    // Получаем данные пользователя из сессии/localStorage
    const userData = JSON.parse(localStorage.getItem('tiktok_user'));
    
    currentUser = {
      id: userData.open_id,
      username: userData.display_name,
      avatar: userData.avatar_url
    };
    
    localStorage.setItem('beceo_user', JSON.stringify(currentUser));
    showAuthenticatedUI();
    notify('✅ Успешный вход через TikTok!');
    
    // Очищаем URL
    window.history.replaceState({}, '', '/');
  }
});
```

## 📊 Структура данных пользователя TikTok

```json
{
  "open_id": "уникальный ID пользователя",
  "union_id": "ID для связи аккаунтов",
  "avatar_url": "https://...",
  "display_name": "Имя пользователя",
  "bio_description": "Описание профиля",
  "follower_count": 1234,
  "following_count": 567
}
```

## 🗄️ База данных (Supabase)

Создай таблицу для пользователей:

```sql
CREATE TABLE beceo_users (
  id BIGSERIAL PRIMARY KEY,
  tiktok_open_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  has_trace BOOLEAN DEFAULT FALSE
);

CREATE TABLE beceo_traces (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES beceo_users(id),
  message TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE beceo_likes (
  user_id BIGINT REFERENCES beceo_users(id),
  trace_id BIGINT REFERENCES beceo_traces(id),
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, trace_id)
);
```

## 🚀 Быстрый старт (для тестирования)

Пока нет backend, можешь использовать демо-режим:

```javascript
function loginWithTikTok() {
  // Симуляция TikTok авторизации
  notify('🔄 Подключение к TikTok...');
  
  setTimeout(() => {
    const demoUser = {
      id: 'tiktok_' + Date.now(),
      username: 'demo_tiktok_user',
      avatar: 'https://via.placeholder.com/100'
    };
    
    currentUser = demoUser;
    localStorage.setItem('beceo_user', JSON.stringify(demoUser));
    showAuthenticatedUI();
    notify('✅ Демо-вход выполнен (TikTok OAuth в разработке)');
  }, 1500);
}
```

## 📚 Полезные ссылки

- [TikTok for Developers](https://developers.tiktok.com/)
- [TikTok Login Kit Documentation](https://developers.tiktok.com/doc/login-kit-web/)
- [OAuth 2.0 Flow](https://developers.tiktok.com/doc/oauth-user-access-token-management/)
- [API Reference](https://developers.tiktok.com/doc/tiktok-api-v2-get-user-info/)

## ⚠️ Важные моменты

1. **Client Secret** никогда не должен быть в frontend коде
2. Используй HTTPS для production
3. Храни токены безопасно (httpOnly cookies или secure storage)
4. Обновляй access_token через refresh_token
5. Проверяй срок действия токенов

## 🎯 Рекомендация

Для BE CEO лучше всего подойдёт **Supabase Edge Functions** - это:
- Бесплатно для старта
- Не нужен свой сервер
- Легко деплоить
- Интеграция с Supabase DB

Следующий шаг: создай Supabase проект и настрой Edge Function для TikTok OAuth!

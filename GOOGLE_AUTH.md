# Настройка Google OAuth для BE CEO

## Шаг 1: Создание проекта в Google Cloud Console

1. Перейди на [Google Cloud Console](https://console.cloud.google.com/)
2. Создай новый проект или выбери существующий
3. Название проекта: `BE CEO`

## Шаг 2: Настройка OAuth consent screen

1. В меню слева выбери **APIs & Services** → **OAuth consent screen**
2. Выбери **External** (для публичного доступа)
3. Заполни обязательные поля:
   - **App name**: BE CEO
   - **User support email**: твой email
   - **Developer contact information**: твой email
4. Нажми **Save and Continue**
5. На странице **Scopes** нажми **Add or Remove Scopes** и выбери:
   - `userinfo.email`
   - `userinfo.profile`
6. Нажми **Save and Continue**
7. На странице **Test users** можешь добавить тестовых пользователей (опционально)
8. Нажми **Save and Continue**

## Шаг 3: Создание OAuth 2.0 Client ID

1. В меню слева выбери **APIs & Services** → **Credentials**
2. Нажми **Create Credentials** → **OAuth client ID**
3. Выбери **Application type**: **Web application**
4. Заполни поля:
   - **Name**: BE CEO Web Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:5500` (для локальной разработки)
     - `https://твой-домен.com` (твой продакшн домен)
   - **Authorized redirect URIs**:
     - `http://localhost:5500/callback` (для локальной разработки)
     - `https://твой-домен.com/callback` (твой продакшн домен)
5. Нажми **Create**
6. **ВАЖНО**: Скопируй **Client ID** - он понадобится в коде

## Шаг 4: Интеграция в код

### 4.1. Добавь Google Sign-In библиотеку

В `index.html` добавь перед закрывающим тегом `</head>`:

```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

### 4.2. Обновление функции loginWithGoogle()

Замени текущую функцию `loginWithGoogle()` в `app.js`:

```javascript
// Инициализация Google Sign-In
function initGoogleSignIn() {
  google.accounts.id.initialize({
    client_id: 'ВАШ_CLIENT_ID.apps.googleusercontent.com', // Замени на свой Client ID
    callback: handleGoogleCallback
  });
}

// Обработчик Google OAuth callback
function handleGoogleCallback(response) {
  // Декодируем JWT токен
  const userInfo = parseJwt(response.credential);
  
  console.log('Google User Info:', userInfo);
  
  // Проверяем, есть ли уже username для этого Google ID
  const savedGoogleUsers = JSON.parse(localStorage.getItem('beceo_google_users') || '{}');
  
  if (savedGoogleUsers[userInfo.sub]) {
    // Пользователь уже регистрировался
    const userData = savedGoogleUsers[userInfo.sub];
    currentUser = userData;
    localStorage.setItem('beceo_user', JSON.stringify(currentUser));
    showAuthenticatedUI();
    notify('✅ С возвращением, ' + userData.username + '!');
  } else {
    // Новый пользователь - нужно выбрать username
    const tempUser = {
      id: userInfo.sub,
      googleEmail: userInfo.email,
      googleName: userInfo.name,
      googlePicture: userInfo.picture,
      avatar: userInfo.picture,
      username: null
    };
    
    // Сохраняем временные данные
    sessionStorage.setItem('temp_google_user', JSON.stringify(tempUser));
    
    // Открываем модалку выбора username
    openModal('usernameModal');
  }
}

// Парсинг JWT токена
function parseJwt(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
  return JSON.parse(jsonPayload);
}

// Авторизация через Google
function loginWithGoogle() {
  closeModal('loginModal');
  closeModal('registerModal');
  
  // Запускаем Google Sign-In
  google.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      // Если One Tap не показался, показываем стандартную кнопку
      google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { theme: 'filled_blue', size: 'large', text: 'continue_with' }
      );
    }
  });
}

// Обновленная функция saveUsername
function saveUsername() {
  const username = document.getElementById('usernameInput').value.trim();
  
  if (!username) {
    notify('⚠️ Введи username');
    return;
  }
  
  if (username.length < 3) {
    notify('⚠️ Username должен быть минимум 3 символа');
    return;
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    notify('⚠️ Username может содержать только буквы, цифры и _');
    return;
  }
  
  // Проверяем, не занят ли username
  const savedUsers = JSON.parse(localStorage.getItem('beceo_all_usernames') || '[]');
  if (savedUsers.includes(username.toLowerCase())) {
    notify('❌ Этот username уже занят');
    return;
  }
  
  // Получаем временные данные Google
  const tempUser = JSON.parse(sessionStorage.getItem('temp_google_user'));
  
  // Создаем полного пользователя
  currentUser = {
    id: tempUser.id,
    username: username,
    googleEmail: tempUser.googleEmail,
    googleName: tempUser.googleName,
    avatar: tempUser.googlePicture
  };
  
  // Сохраняем
  savedUsers.push(username.toLowerCase());
  localStorage.setItem('beceo_all_usernames', JSON.stringify(savedUsers));
  
  const savedGoogleUsers = JSON.parse(localStorage.getItem('beceo_google_users') || '{}');
  savedGoogleUsers[tempUser.id] = currentUser;
  localStorage.setItem('beceo_google_users', JSON.stringify(savedGoogleUsers));
  
  localStorage.setItem('beceo_user', JSON.stringify(currentUser));
  sessionStorage.removeItem('temp_google_user');
  
  closeModal('usernameModal');
  showAuthenticatedUI();
  notify('🎉 Добро пожаловать, ' + username + '!');
}

// Вызови initGoogleSignIn() при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
  // ... существующий код ...
  
  // Инициализация Google Sign-In
  if (typeof google !== 'undefined') {
    initGoogleSignIn();
  }
});
```

### 4.3. Добавь div для кнопки Google (опционально)

Если хочешь показывать стандартную кнопку Google, добавь в модальное окно:

```html
<div id="googleSignInButton"></div>
```

## Шаг 5: Тестирование

1. Открой сайт в браузере
2. Нажми "Продолжить через Google"
3. Выбери Google аккаунт
4. Введи username
5. Готово!

## Важные замечания

- **Client ID** должен быть заменен на твой реальный
- Для локальной разработки используй `http://localhost:5500`
- Для продакшна добавь свой домен в **Authorized JavaScript origins**
- Google OAuth работает только через HTTPS (кроме localhost)
- Не коммить Client ID в публичный репозиторий (используй переменные окружения)

## Переменные окружения (для продакшна)

Создай файл `.env`:

```
GOOGLE_CLIENT_ID=твой_client_id.apps.googleusercontent.com
```

И используй в коде:

```javascript
client_id: process.env.GOOGLE_CLIENT_ID || 'fallback_client_id'
```

## Полезные ссылки

- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console](https://console.cloud.google.com/)

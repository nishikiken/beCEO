// ===== SUPABASE КОНФИГУРАЦИЯ =====
const SUPABASE_URL = 'https://hyxyablgkjtoxcxnurkk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5eHlhYmxna2p0b3hjeG51cmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxODE5NjksImV4cCI6MjA4NDc1Nzk2OX0._3HQYSymZ2ArXIN143gAiwulCL1yt7i5fiHaTd4bp5U';

// Инициализация Supabase
let supabaseClient = null;
try {
  if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase подключен');
  } else {
    console.warn('⚠️ Supabase SDK не загружен');
  }
} catch (error) {
  console.error('Ошибка инициализации Supabase:', error);
}

// Состояние приложения
let currentUser = null;
let traces = [];
let currentSort = 'recent';
let splashShown = false;

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = '339573359277-jft70s7dso8tc0k070bibubj3k1lmc3v.apps.googleusercontent.com';

// Демо данные (потом заменим на реальную БД)
const demoTraces = [
  {
    id: 1,
    username: "elonmusk",
    avatar: "👨‍🚀",
    message: "Мечтай о невозможном, работай над реальным. Будущее создаётся сегодня.",
    date: new Date('2026-02-01'),
    likes: 1247
  },
  {
    id: 2,
    username: "stevejobs",
    avatar: "🍎",
    message: "Единственный способ делать великую работу — любить то, что ты делаешь.",
    date: new Date('2026-02-02'),
    likes: 892
  },
  {
    id: 3,
    username: "billgates",
    avatar: "💻",
    message: "Успех — плохой учитель. Он заставляет умных людей думать, что они не могут проиграть.",
    date: new Date('2026-02-03'),
    likes: 654
  }
];

// Инициализация
document.addEventListener('DOMContentLoaded', async () => {
  await loadTraces();
  updateStats();
  checkAuth();
  
  // Инициализация Google Sign-In
  initGoogleSignIn();
  
  // Проверяем, показывали ли splash screen
  const splashSeen = sessionStorage.getItem('splash_seen');
  if (!splashSeen) {
    showSplashScreen();
    // Скрываем основной контент пока показывается splash
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('createTraceSection').style.display = 'none';
    document.getElementById('tracesSection').style.display = 'none';
  } else {
    document.getElementById('splashScreen').style.display = 'none';
  }
  
  // Счётчик символов
  const textarea = document.getElementById('traceMessage');
  if (textarea) {
    textarea.addEventListener('input', () => {
      document.getElementById('charCount').textContent = textarea.value.length;
    });
  }
});

// Splash Screen
function showSplashScreen() {
  const splashScreen = document.getElementById('splashScreen');
  const tracesBackground = document.getElementById('tracesBackground');
  
  // Создаём плавающие следы на фоне
  createFloatingTraces(tracesBackground);
  
  // Обработчик клика
  splashScreen.addEventListener('click', () => {
    if (splashShown) return;
    splashShown = true;
    
    const title = document.getElementById('splashTitle');
    const hint = document.getElementById('splashHint');
    
    // Скрываем подсказку
    hint.classList.add('hide');
    
    // Анимация "пробития 4-й стены"
    setTimeout(() => {
      title.classList.add('zoom');
    }, 300);
    
    // Скрываем splash и показываем регистрацию
    setTimeout(() => {
      splashScreen.classList.add('hide');
      sessionStorage.setItem('splash_seen', 'true');
      
      setTimeout(() => {
        splashScreen.style.display = 'none';
        // Показываем основной контент
        document.getElementById('tracesSection').style.display = 'block';
        openModal('registerModal');
      }, 800);
    }, 800);
  });
}

// Создание плавающих следов
function createFloatingTraces(container) {
  const placeholders = [
    { username: 'elonmusk', message: 'Мечтай о невозможном, работай над реальным.' },
    { username: 'stevejobs', message: 'Единственный способ делать великую работу — любить то, что ты делаешь.' },
    { username: 'billgates', message: 'Успех — плохой учитель.' },
    { username: 'markzuckerberg', message: 'Двигайся быстро и ломай стереотипы.' },
    { username: 'jeffbezos', message: 'Твой бренд — это то, что люди говорят о тебе, когда тебя нет в комнате.' },
    { username: 'warrenbuffett', message: 'Цена — это то, что ты платишь. Ценность — это то, что ты получаешь.' },
    { username: 'larrypage', message: 'Всегда работай над чем-то неудобно захватывающим.' },
    { username: 'timcook', message: 'Пусть ценности и убеждения управляют всем, что ты делаешь.' }
  ];
  
  // Создаём 15 следов для непрерывного потока (начинают сразу)
  for (let i = 0; i < 15; i++) {
    const trace = placeholders[i % placeholders.length];
    const card = document.createElement('div');
    card.className = 'trace-float';
    card.style.left = `${Math.random() * 80 + 10}%`;
    // Распределяем следы равномерно по всей высоте экрана для мгновенного старта
    const delayOffset = (i * 18) / 15; // Распределяем по времени анимации
    card.style.animationDelay = `${delayOffset}s`;
    
    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.2); display: flex; align-items: center; justify-content: center; font-size: 18px;">
          👤
        </div>
        <div>
          <div style="font-size: 14px; font-weight: 700; color: #38bdf8;">@${trace.username}</div>
        </div>
      </div>
      <div style="font-size: 13px; color: rgba(255, 255, 255, 0.8);">${trace.message}</div>
    `;
    
    container.appendChild(card);
  }
}

// Проверка авторизации
function checkAuth() {
  const savedUser = localStorage.getItem('beceo_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showAuthenticatedUI();
  } else {
    showUnauthenticatedUI();
  }
}

// Показать UI для авторизованных
function showAuthenticatedUI() {
  const navAuth = document.getElementById('navAuth');
  if (navAuth) navAuth.style.display = 'none';
  
  const userBox = document.getElementById('userBox');
  userBox.classList.add('show');
  
  document.getElementById('usernameLabel').textContent = currentUser.username;
  
  const avatar = document.getElementById('userAvatar');
  if (currentUser.avatar) {
    avatar.innerHTML = `<img src="${currentUser.avatar}" alt="Avatar">`;
  } else {
    avatar.textContent = currentUser.username[0].toUpperCase();
  }
  
  // Проверяем, оставил ли пользователь след
  const userTrace = traces.find(t => t.username === currentUser.username);
  if (userTrace) {
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('createTraceSection').style.display = 'none';
  } else {
    document.getElementById('welcomeSection').style.display = 'none';
    document.getElementById('createTraceSection').style.display = 'block';
  }
}

// Показать UI для неавторизованных
function showUnauthenticatedUI() {
  const navAuth = document.getElementById('navAuth');
  if (navAuth) navAuth.style.display = 'flex';
  
  const userBox = document.getElementById('userBox');
  userBox.classList.remove('show');
  
  // Показываем welcome section с статистикой
  document.getElementById('welcomeSection').style.display = 'flex';
  document.getElementById('createTraceSection').style.display = 'none';
}

// Открыть модальное окно
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

// Закрыть модальное окно
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Инициализация Google Sign-In
function initGoogleSignIn() {
  console.log('Initializing Google Sign-In...');
  
  if (typeof google !== 'undefined' && google.accounts) {
    try {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false // Отключаем FedCM
      });
      
      // Отключаем автоматический One Tap
      google.accounts.id.cancel();
      
      console.log('Google Sign-In initialized successfully');
      
      // Рендерим кнопки Google (опционально)
      const wrapper1 = document.getElementById('googleButtonWrapper');
      const wrapper2 = document.getElementById('googleButtonWrapper2');
      
      if (wrapper1) {
        google.accounts.id.renderButton(wrapper1, {
          theme: 'filled_blue',
          size: 'large',
          text: 'continue_with',
          width: 300
        });
      }
      
      if (wrapper2) {
        google.accounts.id.renderButton(wrapper2, {
          theme: 'filled_blue',
          size: 'large',
          text: 'continue_with',
          width: 300
        });
      }
    } catch (error) {
      console.error('Error initializing Google Sign-In:', error);
    }
  } else {
    console.warn('Google Sign-In library not loaded yet');
    // Попробуем еще раз через секунду
    setTimeout(initGoogleSignIn, 1000);
  }
}

// Обработчик Google OAuth callback
function handleGoogleCallback(response) {
  try {
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
      
      // Закрываем модалки
      closeModal('loginModal');
      closeModal('registerModal');
      
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
      
      // Закрываем модалки входа/регистрации
      closeModal('loginModal');
      closeModal('registerModal');
      
      // Открываем модалку выбора username
      openModal('usernameModal');
    }
  } catch (error) {
    console.error('Google Sign-In error:', error);
    notify('❌ Ошибка авторизации через Google');
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
  
  console.log('loginWithGoogle called');
  console.log('google object:', typeof google);
  
  // Запускаем Google Sign-In
  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    console.log('Google Sign-In available, calling prompt...');
    
    try {
      google.accounts.id.prompt((notification) => {
        console.log('Prompt notification:', notification);
        
        if (notification.isNotDisplayed()) {
          console.error('Prompt not displayed:', notification.getNotDisplayedReason());
          notify('⚠️ Не удалось открыть окно Google: ' + notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
          console.log('Prompt skipped');
          notify('⚠️ Авторизация отменена');
        }
      });
    } catch (error) {
      console.error('Error calling google.accounts.id.prompt:', error);
      notify('❌ Ошибка: ' + error.message);
    }
  } else {
    console.error('Google Sign-In not loaded');
    console.log('Available:', {
      google: typeof google,
      accounts: typeof google?.accounts,
      id: typeof google?.accounts?.id
    });
    notify('❌ Google Sign-In не загружен. Перезагрузи страницу.');
  }
}

// Сохранение username после Google OAuth
async function saveUsername() {
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
  
  // Сохраняем в Supabase
  if (supabaseClient) {
    try {
      // Проверяем, не занят ли username
      const { data: existingUser, error: checkError } = await supabaseClient
        .from('beceo_users')
        .select('username')
        .eq('username', username)
        .maybeSingle();
      
      if (existingUser) {
        notify('❌ Этот username уже занят');
        return;
      }
      
      // Добавляем пользователя в базу
      const { error } = await supabaseClient
        .from('beceo_users')
        .insert({
          id: tempUser.id,
          google_id: tempUser.id,
          username: username,
          email: tempUser.googleEmail,
          avatar_url: tempUser.googlePicture
        });
      
      if (error) {
        // Проверяем на дубликат username (unique constraint)
        if (error.code === '23505') {
          notify('❌ Этот username уже занят');
          return;
        }
        console.error('Supabase error:', error);
        notify('❌ Ошибка сохранения: ' + error.message);
        return;
      }
      
      console.log('✅ Пользователь добавлен в Supabase');
    } catch (error) {
      console.error('Error saving to Supabase:', error);
      notify('❌ Ошибка: ' + error.message);
      return;
    }
  }
  
  // Сохраняем локально (для совместимости)
  const savedUsers = JSON.parse(localStorage.getItem('beceo_all_usernames') || '[]');
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

// Выход
function logout() {
  localStorage.removeItem('beceo_user');
  currentUser = null;
  showUnauthenticatedUI();
  notify('👋 Вы вышли из аккаунта');
  
  // Перезагружаем страницу чтобы показать splash screen снова
  sessionStorage.removeItem('splash_seen');
  location.reload();
}

// Отправить след
async function submitTrace() {
  const message = document.getElementById('traceMessage').value.trim();
  
  if (!message) {
    notify('⚠️ Напиши что-нибудь перед отправкой');
    return;
  }
  
  if (message.length < 10) {
    notify('⚠️ Слишком короткое сообщение (минимум 10 символов)');
    return;
  }
  
  const newTrace = {
    id: Date.now(),
    username: currentUser.username,
    avatar: currentUser.avatar || currentUser.username[0].toUpperCase(),
    message: message,
    date: new Date(),
    likes: 0
  };
  
  // Сохраняем в Supabase
  if (supabaseClient) {
    try {
      const { error } = await supabaseClient
        .from('beceo_traces')
        .insert({
          user_id: currentUser.id,
          username: currentUser.username,
          message: message
        });
      
      if (error) {
        console.error('Supabase error:', error);
        notify('❌ Ошибка сохранения: ' + error.message);
        return;
      }
      
      console.log('✅ След добавлен в Supabase');
    } catch (error) {
      console.error('Error saving trace:', error);
    }
  }
  
  traces.unshift(newTrace);
  saveTraces();
  await renderTraces();
  updateStats();
  
  document.getElementById('createTraceSection').style.display = 'none';
  notify('🎉 Твой след оставлен! Теперь он виден всем');
  
  // Прокрутка к следам
  setTimeout(() => {
    document.getElementById('tracesSection').scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

// Загрузка следов
async function loadTraces() {
  // Загружаем из Supabase
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from('beceo_traces')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Supabase error:', error);
      } else if (data && data.length > 0) {
        traces = data.map(t => ({
          id: t.id,
          username: t.username,
          avatar: '👤', // Можно добавить аватары позже
          message: t.message,
          date: new Date(t.created_at),
          likes: t.likes || 0
        }));
        console.log(`✅ Загружено ${traces.length} следов из Supabase`);
        await renderTraces();
        return;
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
    }
  }
  
  // Fallback: загружаем из localStorage
  const saved = localStorage.getItem('beceo_traces');
  if (saved) {
    traces = JSON.parse(saved).map(t => ({
      ...t,
      date: new Date(t.date)
    }));
  } else {
    traces = [...demoTraces];
    saveTraces();
  }
  await renderTraces();
}

// Сохранение следов
function saveTraces() {
  localStorage.setItem('beceo_traces', JSON.stringify(traces));
}

// Отрисовка следов
async function renderTraces() {
  const grid = document.getElementById('tracesGrid');
  
  // Сортировка
  let sorted = [...traces];
  if (currentSort === 'top') {
    sorted.sort((a, b) => b.likes - a.likes);
  } else {
    sorted.sort((a, b) => b.date - a.date);
  }
  
  grid.innerHTML = '';
  
  sorted.forEach(trace => {
    const card = document.createElement('div');
    card.className = 'trace-card';
    
    const isLiked = isTraceLiked(trace.id);
    const likedClass = isLiked ? 'liked' : '';
    
    card.innerHTML = `
      <div class="trace-header">
        <div class="trace-avatar">${typeof trace.avatar === 'string' && trace.avatar.startsWith('http') 
          ? `<img src="${trace.avatar}" alt="Avatar">` 
          : trace.avatar}</div>
        <div class="trace-info">
          <div class="trace-username">@${trace.username}</div>
          <div class="trace-date">${formatDate(trace.date)}</div>
        </div>
      </div>
      <div class="trace-message">${escapeHtml(trace.message)}</div>
      <div class="trace-footer">
        <button class="like-btn ${likedClass}" onclick="toggleLike('${trace.id}')">
          ${isLiked ? '❤️' : '🤍'} <span>${trace.likes}</span>
        </button>
        <div class="like-count">${trace.likes} ${pluralize(trace.likes, 'лайк', 'лайка', 'лайков')}</div>
      </div>
    `;
    
    grid.appendChild(card);
  });
}

// Лайк/дизлайк
function toggleLike(traceId) {
  if (!currentUser) {
    notify('⚠️ Войди, чтобы ставить лайки');
    return;
  }
  
  const trace = traces.find(t => t.id === traceId);
  if (!trace) return;
  
  const likes = getLikes();
  const likeKey = `${currentUser.id}_${traceId}`;
  
  if (likes.includes(likeKey)) {
    // Убрать лайк
    const index = likes.indexOf(likeKey);
    likes.splice(index, 1);
    trace.likes--;
  } else {
    // Поставить лайк
    likes.push(likeKey);
    trace.likes++;
  }
  
  saveLikes(likes);
  saveTraces();
  
  // Обновляем только конкретную карточку, а не весь список
  updateTraceCard(traceId);
}

// Проверка лайка
function isTraceLiked(traceId) {
  if (!currentUser) return false;
  const likes = getLikes();
  return likes.includes(`${currentUser.id}_${traceId}`);
}

// Получить лайки
function getLikes() {
  const saved = localStorage.getItem('beceo_likes');
  return saved ? JSON.parse(saved) : [];
}

// Сохранить лайки
function saveLikes(likes) {
  localStorage.setItem('beceo_likes', JSON.stringify(likes));
}

// Сортировка
async function sortBy(type) {
  currentSort = type;
  
  // Обновить кнопки
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  await renderTraces();
}

// Обновление статистики
function updateStats() {
  const totalTraces = traces.length;
  const totalLikes = traces.reduce((sum, t) => sum + t.likes, 0);
  
  document.getElementById('totalTraces').textContent = totalTraces;
  document.getElementById('totalLikes').textContent = totalLikes;
}

// Уведомление
function notify(text) {
  const n = document.getElementById('notify');
  n.textContent = text;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), 3000);
}

// Форматирование даты
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 7) {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
  } else if (days > 0) {
    return `${days} ${pluralize(days, 'день', 'дня', 'дней')} назад`;
  } else if (hours > 0) {
    return `${hours} ${pluralize(hours, 'час', 'часа', 'часов')} назад`;
  } else if (minutes > 0) {
    return `${minutes} ${pluralize(minutes, 'минуту', 'минуты', 'минут')} назад`;
  } else {
    return 'только что';
  }
}

// Плюрализация
function pluralize(n, one, two, five) {
  n = Math.abs(n) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return five;
  if (n1 > 1 && n1 < 5) return two;
  if (n1 === 1) return one;
  return five;
}

// Обновить конкретную карточку следа
function updateTraceCard(traceId) {
  const trace = traces.find(t => t.id === traceId);
  if (!trace) return;
  
  const cards = document.querySelectorAll('.trace-card');
  cards.forEach(card => {
    const likeBtn = card.querySelector('.like-btn');
    if (!likeBtn) return;
    
    // Проверяем, что это нужная карточка (по тексту username)
    const usernameEl = card.querySelector('.trace-username');
    if (usernameEl && usernameEl.textContent === '@' + trace.username) {
      const isLiked = isTraceLiked(trace.id);
      
      // Обновляем кнопку лайка
      likeBtn.className = `like-btn ${isLiked ? 'liked' : ''}`;
      likeBtn.innerHTML = `${isLiked ? '❤️' : '🤍'} <span>${trace.likes}</span>`;
      
      // Обновляем счётчик
      const likeCount = card.querySelector('.like-count');
      if (likeCount) {
        likeCount.textContent = `${trace.likes} ${pluralize(trace.likes, 'лайк', 'лайка', 'лайков')}`;
      }
    }
  });
}

// Делаем функции глобальными
window.openProfile = openProfile;
window.closeProfile = closeProfile;
window.createListing = createListing;
window.closeCreateListing = closeCreateListing;
window.publishListing = publishListing;
window.switchProfileTab = switchProfileTab;
window.loadMyListings = loadMyListings;
window.deleteListing = deleteListing;
window.openTopup = openTopup;
window.closeTopup = closeTopup;
window.processTopup = processTopup;
window.selectPaymentMethod = selectPaymentMethod;
window.closeListingDetail = closeListingDetail;
window.calculatePurchaseFromAmount = calculatePurchaseFromAmount;
window.calculatePurchaseFromPrice = calculatePurchaseFromPrice;
window.purchaseWithBalance = purchaseWithBalance;
window.purchaseWithTopup = purchaseWithTopup;
window.openModal = openModal;
window.closeModal = closeModal;
window.logout = logout;
window.loginWithGoogle = loginWithGoogle;
window.saveUsername = saveUsername;

// Экранирование HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

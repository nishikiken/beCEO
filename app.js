// Состояние приложения
let currentUser = null;
let traces = [];
let currentSort = 'recent';
let splashShown = false;

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
document.addEventListener('DOMContentLoaded', () => {
  loadTraces();
  updateStats();
  checkAuth();
  
  // Проверяем, показывали ли splash screen
  const splashSeen = sessionStorage.getItem('splash_seen');
  if (!splashSeen) {
    showSplashScreen();
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
        openModal('registerModal');
      }, 1000);
    }, 1100);
  });
}

// Создание плавающих следов
function createFloatingTraces(container) {
  const placeholders = [
    { username: 'elonmusk', message: 'Мечтай о невозможном, работай над реальным.' },
    { username: 'stevejobs', message: 'Единственный способ делать великую работу — любить то, что ты делаешь.' },
    { username: 'billgates', message: 'Успех — плохой учитель.' },
    { username: 'markzuckerberg', message: 'Двигайся быстро и ломай стереотипы.' },
    { username: 'jeffbezos', message: 'Твой бренд — это то, что люди говорят о тебе, когда тебя нет в комнате.' }
  ];
  
  // Создаём 8 следов с разными задержками
  for (let i = 0; i < 8; i++) {
    const trace = placeholders[i % placeholders.length];
    const card = document.createElement('div');
    card.className = 'trace-float';
    card.style.left = `${Math.random() * 80 + 10}%`;
    card.style.animationDelay = `${i * 2}s`;
    
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
  if (navAuth) navAuth.style.display = 'block';
  
  const userBox = document.getElementById('userBox');
  userBox.classList.remove('show');
  
  document.getElementById('welcomeSection').style.display = 'flex';
  document.getElementById('createTraceSection').style.display = 'none';
}

// Открыть модальное окно
function openModal(id) {
  document.getElementById(id).classList.add('active');
  if (tg) tg.HapticFeedback.impactOccurred('medium');
}

// Закрыть модальное окно
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
  if (tg) tg.HapticFeedback.impactOccurred('light');
}

// Вход
function login() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  
  if (!username || !password) {
    notify('⚠️ Заполни все поля');
    return;
  }
  
  // Демо-логика (потом заменим на реальную)
  const savedUsers = JSON.parse(localStorage.getItem('beceo_registered_users') || '[]');
  const user = savedUsers.find(u => u.username === username && u.password === password);
  
  if (user) {
    currentUser = {
      id: user.id,
      username: user.username,
      avatar: user.avatar
    };
    
    localStorage.setItem('beceo_user', JSON.stringify(currentUser));
    showAuthenticatedUI();
    closeModal('loginModal');
    notify('✅ Добро пожаловать, ' + username + '!');
  } else {
    notify('❌ Неверный логин или пароль');
  }
}

// Регистрация
function register() {
  const name = document.getElementById('registerName').value.trim();
  const username = document.getElementById('registerUser').value.trim();
  const password = document.getElementById('registerPass').value;
  
  if (!name || !username || !password) {
    notify('⚠️ Заполни все поля');
    return;
  }
  
  if (username.length < 3) {
    notify('⚠️ Логин должен быть минимум 3 символа');
    return;
  }
  
  if (password.length < 6) {
    notify('⚠️ Пароль должен быть минимум 6 символов');
    return;
  }
  
  // Демо-логика (потом заменим на реальную)
  const savedUsers = JSON.parse(localStorage.getItem('beceo_registered_users') || '[]');
  
  if (savedUsers.find(u => u.username === username)) {
    notify('❌ Этот логин уже занят');
    return;
  }
  
  const newUser = {
    id: Date.now(),
    name: name,
    username: username,
    password: password,
    avatar: null
  };
  
  savedUsers.push(newUser);
  localStorage.setItem('beceo_registered_users', JSON.stringify(savedUsers));
  
  currentUser = {
    id: newUser.id,
    username: newUser.username,
    avatar: newUser.avatar
  };
  
  localStorage.setItem('beceo_user', JSON.stringify(currentUser));
  showAuthenticatedUI();
  closeModal('registerModal');
  notify('🎉 Аккаунт создан! Добро пожаловать!');
}

// Авторизация через Google (заглушка)
function loginWithGoogle() {
  notify('🚧 Авторизация через Google находится в разработке');
  closeModal('loginModal');
  closeModal('registerModal');
  
  // Демо авторизация для тестирования
  setTimeout(() => {
    const demoUser = {
      id: Date.now(),
      username: 'google_user_' + Math.floor(Math.random() * 1000),
      avatar: null
    };
    
    currentUser = demoUser;
    localStorage.setItem('beceo_user', JSON.stringify(demoUser));
    showAuthenticatedUI();
    notify('✅ Вы успешно вошли через Google');
  }, 1500);
}

// Выход
function logout() {
  localStorage.removeItem('beceo_user');
  currentUser = null;
  showUnauthenticatedUI();
  notify('👋 Вы вышли из аккаунта');
}

// Отправить след
function submitTrace() {
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
  
  traces.unshift(newTrace);
  saveTraces();
  renderTraces();
  updateStats();
  
  document.getElementById('createTraceSection').style.display = 'none';
  notify('🎉 Твой след оставлен! Теперь он виден всем');
  
  // Прокрутка к следам
  setTimeout(() => {
    document.getElementById('tracesSection').scrollIntoView({ behavior: 'smooth' });
  }, 500);
}

// Загрузка следов
function loadTraces() {
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
  renderTraces();
}

// Сохранение следов
function saveTraces() {
  localStorage.setItem('beceo_traces', JSON.stringify(traces));
}

// Отрисовка следов
function renderTraces() {
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
        <button class="like-btn ${likedClass}" onclick="toggleLike(${trace.id})">
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
function sortBy(type) {
  currentSort = type;
  
  // Обновить кнопки
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  renderTraces();
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
window.login = login;
window.register = register;
window.logout = logout;
window.loginWithGoogle = loginWithGoogle;

// Экранирование HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

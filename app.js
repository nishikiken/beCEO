// Состояние приложения
let currentUser = null;
let traces = [];
let currentSort = 'recent';

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
  
  // Счётчик символов
  const textarea = document.getElementById('traceMessage');
  if (textarea) {
    textarea.addEventListener('input', () => {
      document.getElementById('charCount').textContent = textarea.value.length;
    });
  }
});

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
  document.getElementById('userBox').style.display = 'flex';
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
  document.getElementById('userBox').style.display = 'none';
  document.getElementById('welcomeSection').style.display = 'flex';
  document.getElementById('createTraceSection').style.display = 'none';
}

// Авторизация через TikTok (заглушка)
function loginWithTikTok() {
  notify('🚧 Авторизация через TikTok находится в разработке');
  
  // Демо авторизация для тестирования
  setTimeout(() => {
    const demoUser = {
      id: Date.now(),
      username: 'demo_user_' + Math.floor(Math.random() * 1000),
      avatar: null
    };
    
    currentUser = demoUser;
    localStorage.setItem('beceo_user', JSON.stringify(demoUser));
    showAuthenticatedUI();
    notify('✅ Вы успешно вошли как ' + demoUser.username);
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

// Экранирование HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

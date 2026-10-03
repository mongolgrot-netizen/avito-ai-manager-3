const API = 'https://avito-manager-server.onrender.com';

const listingsData = [
  ['Премиальные ограждения из нержавейки и мрамора', 642, 16, 82],
  ['Мраморные лестницы на заказ — Москва', 411, 7, 48],
  ['Столешницы из натурального камня', 286, 4, 36],
  ['Входные группы из металла и нержавейки', 503, 10, 67]
];

const screens = [...document.querySelectorAll('.screen')];

function show(name) {
  screens.forEach(s => {
    s.classList.toggle('active', s.id === name);
  });

  document.querySelectorAll('.nav').forEach(n => {
    n.classList.toggle('active', n.dataset.screen === name);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-screen]').forEach(x => {
  x.onclick = () => show(x.dataset.screen);
});

function toast(message) {
  const el = document.getElementById('toast');

  el.textContent = message;
  el.classList.add('show');

  setTimeout(() => {
    el.classList.remove('show');
  }, 2500);
}

async function api(path, options = {}) {
  try {
    const response = await fetch(API + path, {
      headers: {
        'Content-Type': 'application/json'
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Ошибка сервера');
    }

    return data;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

/* Проверка сервера */

async function checkServer() {
  try {
    const data = await api('/api/health');

    if (data.ok) {
      console.log('Avito Manager Server: ONLINE');
      return true;
    }

  } catch (error) {
    console.error('Server unavailable:', error);
  }

  return false;
}

/* Объявления */

function renderListings(items = null) {
  const list = document.getElementById('listing-list');

  const data = items && items.length
    ? items.map(x => [
        x.title || 'Без названия',
        x.views || 0,
        x.messages || 0,
        x.conversion || 50
      ])
    : listingsData;

  list.innerHTML = data.map((x, i) => `
    <div class="listing">
      <h3>${escapeHtml(x[0])}</h3>

      <div class="listing-meta">
        <span>👁 ${x[1]}</span>
        <span>💬 ${x[2]}</span>
        <span>${i === 1 ? '⚠ Проверить' : '✓ Активно'}</span>
      </div>

      <div class="bar">
        <span style="width:${Math.min(Number(x[3]) || 0, 100)}%"></span>
      </div>
    </div>
  `).join('');
}

async function loadListings() {
  try {
    const data = await api('/api/ads');

    if (data.items && data.items.length) {
      renderListings(data.items);
    } else {
      renderListings();
    }

  } catch (error) {
    renderListings();
    console.log('Используются тестовые объявления');
  }
}

/* Лиды */

async function loadLeads() {
  try {
    const data = await api('/api/leads');

    console.log('Лиды с сервера:', data);

    if (data.items && data.items.length) {
      toast(`Загружено лидов: ${data.items.length}`);
    }

  } catch (error) {
    console.log('Лиды пока отсутствуют');
  }
}

/* Настройки */

async function loadSettings() {
  try {
    const data = await api('/api/settings');

    const status = document.getElementById('avitoStatus');

    if (status) {
      status.textContent = data.avitoConnected
        ? 'Подключён'
        : 'Не подключён';
    }

  } catch (error) {
    console.log('Не удалось загрузить настройки');
  }
}

/* AI-анализ */

async function runAIAnalysis() {
  toast('AI анализирует данные…');

  try {
    const result = await api('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        text: 'Проанализируй объявления и лиды Avito для премиального производства металла, нержавейки и натурального камня в Москве и Московской области.'
      })
    });

    show('ai');

    const recommendation = document.getElementById('recommendations');

    if (recommendation && result.analysis) {
      recommendation.innerHTML = `
        <article>
          <i>01</i>
          <div>
            <b>AI-анализ завершён</b>
            <p>${escapeHtml(result.analysis.recommendation || 'Получены рекомендации.')}</p>
          </div>
        </article>
      `;
    }

    toast('AI-анализ завершён');

  } catch (error) {
    toast('Ошибка соединения с AI-сервером');
  }
}

document.getElementById('analyze').onclick = runAIAnalysis;
document.getElementById('runAgent').onclick = runAIAnalysis;

/* Генерация ответа клиенту */

document.getElementById('reply').onclick = async () => {
  const message = document.getElementById('clientMsg').value.trim();
  const output = document.getElementById('replyOut');

  if (!message) {
    output.style.display = 'block';
    output.textContent = 'Вставьте сообщение клиента, и AI подготовит ответ.';
    return;
  }

  output.style.display = 'block';
  output.textContent = 'AI готовит ответ…';

  try {
    const result = await api('/api/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({
        text: message
      })
    });

    const recommendation =
      result.analysis?.recommendation ||
      'Добрый день! Пришлите, пожалуйста, фото или проект, размеры и город объекта. После этого сможем сориентировать вас по технологии, срокам и стоимости.';

    output.textContent =
      'Добрый день! ' + recommendation;

  } catch (error) {
    output.textContent =
      'Не удалось связаться с AI-сервером. Проверьте подключение к интернету.';
  }
};

/* Подключение Avito */

document.getElementById('connect').onclick = async () => {
  toast('Проверяем подключение Avito…');

  try {
    const result = await api('/api/avito/connect', {
      method: 'POST'
    });

    if (result.connected) {
      document.getElementById('avitoStatus').textContent = 'Подключён';
      toast('Avito подключён');
    } else {
      toast(result.message || 'Подключение Avito пока не настроено');
    }

  } catch (error) {
    toast('Ошибка подключения Avito');
  }
};

/* Безопасный вывод текста */

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/* PWA */

let deferred;

window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();

  deferred = event;

  const install = document.getElementById('install');

  if (install) {
    install.hidden = false;
  }
});

document.getElementById('install').onclick = async () => {
  if (deferred) {
    deferred.prompt();
    deferred = null;
  }
};

/* Service Worker */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('./sw.js')
    .catch(error => console.log('Service Worker:', error));
}

/* Запуск приложения */

async function init() {
  renderListings();

  const online = await checkServer();

  if (online) {
    console.log('✓ Сервер Avito Manager подключён');

    await loadListings();
    await loadLeads();
    await loadSettings();
  } else {
    console.log('✕ Сервер недоступен');
    toast('Сервер временно недоступен');
  }
}

init();

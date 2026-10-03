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

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

document.querySelectorAll('[data-screen]').forEach(x => {
  x.onclick = () => show(x.dataset.screen);
});

function toast(message) {
  const el = document.getElementById('toast');

  if (!el) return;

  el.textContent = message;
  el.classList.add('show');

  setTimeout(() => {
    el.classList.remove('show');
  }, 2500);
}

async function api(path, options = {}) {

  const response = await fetch(API + path, {
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      'Ошибка сервера'
    );
  }

  return data;
}

function escapeHtml(value) {

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


// ======================================================
// ОБЪЯВЛЕНИЯ
// ======================================================

function renderListings(items = null) {

  const list = document.getElementById('listing-list');

  if (!list) return;

  const data =
    items && items.length
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

        <span>
          ${i === 1 ? '⚠ Проверить' : '✓ Активно'}
        </span>

      </div>

      <div class="bar">
        <span
          style="width:${Math.min(Number(x[3]) || 0, 100)}%">
        </span>
      </div>

    </div>

  `).join('');
}

async function loadListings() {

  try {

    const data = await api('/api/ads');

    renderListings(
      data.items && data.items.length
        ? data.items
        : null
    );

  } catch {

    renderListings();
  }
}


// ======================================================
// ЛИДЫ
// ======================================================

async function loadLeads() {

  try {

    const data = await api('/api/leads');

    console.log('Лиды:', data);

  } catch {

    console.log('Лиды пока отсутствуют');

  }
}


// ======================================================
// НАСТРОЙКИ
// ======================================================

async function loadSettings() {

  try {

    const data = await api('/api/settings');

    const status =
      document.getElementById('avitoStatus');

    if (status) {

      status.textContent =
        data.avitoConnected
          ? 'Подключён'
          : 'Не подключён';

    }

  } catch {

    console.log('Настройки недоступны');

  }
}


// ======================================================
// AI — ПОЛНЫЙ АНАЛИЗ
// ======================================================

async function analyzeClientMessage(message) {

  const result = await api('/api/ai/lead', {

    method: 'POST',

    body: JSON.stringify({
      message
    })

  });

  return result.result;
}


// ======================================================
// AI — ОТОБРАЖЕНИЕ ЛИДА
// ======================================================

function renderLeadAnalysis(data) {

  const output =
    document.getElementById('replyOut');

  if (!output) return;

  const temperature =
    String(data.lead_temperature || 'WARM')
      .toUpperCase();

  const intent =
    data.intent || 'unknown';

  const temperatureText = {

    HOT: '🔥 Горячий лид',

    WARM: '🟠 Тёплый лид',

    COLD: '🔵 Холодный лид'

  }[temperature] || '🟠 Тёплый лид';

  const intentText = {

    price: 'Цена',

    calculation: 'Расчёт',

    project: 'Проект',

    installation: 'Монтаж',

    consultation: 'Консультация',

    purchase: 'Готов заказать',

    information: 'Информация',

    unknown: 'Не определено'

  }[intent] || 'Не определено';

  const missing =
    Array.isArray(data.missing_information)
      ? data.missing_information
      : [];

  const missingHtml =
    missing.length
      ? missing.map(item =>
          `<li>${escapeHtml(item)}</li>`
        ).join('')
      : '<li>Дополнительные данные не требуются</li>';

  output.style.display = 'block';

  output.innerHTML = `

    <div class="ai-result">

      <div class="ai-result-header">

        <strong>${temperatureText}</strong>

        <span class="ai-intent">
          ${escapeHtml(intentText)}
        </span>

      </div>


      <div class="ai-section">

        <div class="ai-label">
          ЧТО ХОЧЕТ КЛИЕНТ
        </div>

        <div class="ai-text">
          ${escapeHtml(
            data.client_need ||
            'AI определяет потребность клиента'
          )}
        </div>

      </div>


      <div class="ai-section">

        <div class="ai-label">
          ЧЕГО НЕ ХВАТАЕТ
        </div>

        <ul class="ai-list">
          ${missingHtml}
        </ul>

      </div>


      <div class="ai-section">

        <div class="ai-label">
          РЕКОМЕНДАЦИЯ МЕНЕДЖЕРУ
        </div>

        <div class="ai-text">
          ${escapeHtml(
            data.recommendation ||
            'Продолжить диалог'
          )}
        </div>

      </div>


      <div class="ai-section ai-reply-section">

        <div class="ai-label">
          ГОТОВЫЙ ОТВЕТ КЛИЕНТУ
        </div>

        <div
          id="aiReplyText"
          class="ai-reply"
        >
          ${escapeHtml(
            data.reply ||
            'Ответ не сформирован'
          )}
        </div>

        <button
          id="copyAiReply"
          class="ai-copy-button"
          type="button"
        >
          📋 Скопировать ответ
        </button>

      </div>


      <div class="ai-next">

        <span>Следующий шаг</span>

        <strong>
          ${escapeHtml(
            data.next_step ||
            'Продолжить диалог'
          )}
        </strong>

      </div>

    </div>

  `;

  const copyButton =
    document.getElementById('copyAiReply');

  if (copyButton) {

    copyButton.onclick = async () => {

      const reply =
        data.reply || '';

      try {

        await navigator.clipboard.writeText(reply);

        copyButton.textContent =
          '✓ Ответ скопирован';

        toast('Ответ скопирован');

        setTimeout(() => {

          copyButton.textContent =
            '📋 Скопировать ответ';

        }, 2000);

      } catch {

        toast('Не удалось скопировать');

      }

    };

  }
}


// ======================================================
// КНОПКА "ОТВЕТИТЬ"
// ======================================================

const replyButton =
  document.getElementById('reply');

if (replyButton) {

  replyButton.onclick = async () => {

    const input =
      document.getElementById('clientMsg');

    const message =
      input?.value.trim() || '';

    const output =
      document.getElementById('replyOut');

    if (!message) {

      if (output) {

        output.style.display = 'block';

        output.innerHTML = `
          <div class="ai-empty">
            Вставьте сообщение клиента,
            и AI проведёт анализ.
          </div>
        `;

      }

      return;

    }

    if (output) {

      output.style.display = 'block';

      output.innerHTML = `
        <div class="ai-loading">
          <div class="ai-spinner"></div>
          AI анализирует клиента…
        </div>
      `;

    }

    try {

      const result =
        await analyzeClientMessage(message);

      renderLeadAnalysis(result);

      toast('Анализ клиента завершён');

    } catch (error) {

      console.error(error);

      if (output) {

        output.innerHTML = `
          <div class="ai-error">
            Не удалось получить ответ AI.
            Проверьте соединение с сервером.
          </div>
        `;

      }

      toast('Ошибка AI');

    }

  };

}


// ======================================================
// AI АНАЛИЗ ОБЩИЙ
// ======================================================

async function runAIAnalysis() {

  const text = `
Проанализируй текущую ситуацию
в продажах компании.

Основные направления:

Премиальные ограждения из нержавеющей стали
и натурального камня.

Мраморные лестницы.

Металлические конструкции.

Входные группы.

Столешницы из натурального камня.

Целевая аудитория:
Москва и Московская область,
обеспеченные частные клиенты,
дизайнеры, архитекторы и строительные компании.

Дай практические рекомендации
по увеличению количества обращений.
`;

  toast('AI анализирует данные…');

  try {

    const result =
      await api('/api/ai/analyze', {

        method: 'POST',

        body: JSON.stringify({
          text
        })

      });

    const recommendation =
      document.getElementById('recommendations');

    if (recommendation) {

      const data =
        result.analysis || {};

      recommendation.innerHTML = `

        <article>

          <i>01</i>

          <div>

            <b>AI-анализ завершён</b>

            <p>
              ${escapeHtml(
                data.recommendation ||
                'AI подготовил рекомендации.'
              )}
            </p>

          </div>

        </article>

      `;

    }

    show('ai');

    toast('AI-анализ завершён');

  } catch (error) {

    console.error(error);

    toast('Ошибка соединения с AI');

  }

}


const analyzeButton =
  document.getElementById('analyze');

if (analyzeButton) {

  analyzeButton.onclick =
    runAIAnalysis;

}


const agentButton =
  document.getElementById('runAgent');

if (agentButton) {

  agentButton.onclick =
    runAIAnalysis;

}


// ======================================================
// AVITO
// ======================================================

const connectButton =
  document.getElementById('connect');

if (connectButton) {

  connectButton.onclick = async () => {

    toast('Проверяем подключение Avito…');

    try {

      const result =
        await api('/api/avito/connect', {
          method: 'POST'
        });

      if (result.connected) {

        const status =
          document.getElementById('avitoStatus');

        if (status) {
          status.textContent =
            'Подключён';
        }

        toast('Avito подключён');

      } else {

        toast(
          result.message ||
          'Подключение Avito пока не настроено'
        );

      }

    } catch {

      toast('Ошибка подключения Avito');

    }

  };

}


// ======================================================
// PWA
// ======================================================

let deferredPrompt;

window.addEventListener(
  'beforeinstallprompt',
  event => {

    event.preventDefault();

    deferredPrompt = event;

    const install =
      document.getElementById('install');

    if (install) {
      install.hidden = false;
    }

  }
);

const installButton =
  document.getElementById('install');

if (installButton) {

  installButton.onclick = async () => {

    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    deferredPrompt = null;

  };

}


// ======================================================
// SERVICE WORKER
// ======================================================

if ('serviceWorker' in navigator) {

  navigator.serviceWorker
    .register('./sw.js')
    .catch(error =>
      console.log(
        'Service Worker:',
        error
      )
    );

}


// ======================================================
// SERVER CHECK
// ======================================================

async function checkServer() {

  try {

    const data =
      await api('/api/health');

    return data.ok === true;

  } catch {

    return false;

  }

}


// ======================================================
// INIT
// ======================================================

async function init() {

  renderListings();

  const online =
    await checkServer();

  if (online) {

    console.log(
      '✓ Avito Manager Server ONLINE'
    );

    await loadListings();
    await loadLeads();
    await loadSettings();

  } else {

    console.log(
      '✕ Server unavailable'
    );

    toast(
      'Сервер временно недоступен'
    );

  }

}

init();

import { SAGAS } from '../data/sagas';
import { UserConfig } from '../types';
import { ADDON_VERSION } from '../version';

export function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function safeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

export function renderConfigurePage(
  initialConfig?: UserConfig,
  version = ADDON_VERSION,
  nonce?: string
): string {
  const defaultConfig: UserConfig = initialConfig ?? {
    lang: 'en',
    sagas: SAGAS.map((s) => s.id),
  };

  const simpsonsCount = SAGAS.filter((s) => s.universe === 'simpsons').length;
  const futuramaCount = SAGAS.filter((s) => s.universe === 'futurama').length;
  const crossoverCount = SAGAS.filter((s) => s.universe === 'crossover').length;

  const clientSagasPayload = SAGAS.map((s) => ({
    id: s.id,
    universe: s.universe,
    name: s.name,
    description: s.description,
    episodeCount: s.episodes.length,
  }));

  const nonceAttr = nonce ? ` nonce="${escHtml(nonce)}"` : '';

  return `<!DOCTYPE html>
<html lang="${escHtml(defaultConfig.lang)}" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/favicon.ico" />
  <title>Springfield 3000 — Addon Configurator</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #020617;
      color: #f8fafc;
      min-height: 100vh;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .container { max-width: 56rem; margin: 0 auto; padding: 2rem 1rem 3rem 1rem; }
    .text-center { text-align: center; }
    .header { margin-bottom: 2rem; }
    .title {
      font-size: 2.25rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      background: linear-gradient(to right, #facc15, #f59e0b, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    @media (min-width: 768px) { .title { font-size: 3rem; } }
    .subtitle { margin-top: 0.5rem; color: #94a3b8; font-size: 0.95rem; max-width: 36rem; margin-left: auto; margin-right: auto; }
    .card {
      background: rgba(15, 23, 42, 0.85);
      border: 1px solid #1e293b;
      border-radius: 1rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(8px);
    }
    .flex-between { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .btn-group { display: inline-flex; background: #020617; padding: 0.25rem; border-radius: 0.75rem; border: 1px solid #1e293b; }
    .btn-lang {
      padding: 0.375rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      background: transparent;
      color: #94a3b8;
      transition: all 0.15s ease;
    }
    .btn-lang.active { background: #facc15; color: #020617; box-shadow: 0 1px 3px rgba(0,0,0,0.3); }
    .counter { font-size: 0.75rem; font-weight: 600; color: #34d399; background: rgba(6, 78, 59, 0.5); border: 1px solid rgba(5, 150, 105, 0.5); padding: 0.375rem 0.75rem; border-radius: 0.5rem; }
    .btn-action {
      background: #1e293b;
      color: #e2e8f0;
      border: none;
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
    }
    .btn-action:hover { background: #334155; }
    .group-details {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #1e293b;
      border-radius: 1rem;
      overflow: hidden;
      margin-bottom: 1rem;
    }
    .group-summary {
      cursor: pointer;
      user-select: none;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #0f172a;
      transition: background 0.15s ease;
      list-style: none;
    }
    .group-summary::-webkit-details-marker { display: none; }
    .group-summary:hover { background: #1e293b; }
    .group-title { font-size: 1.1rem; font-weight: 700; color: #f8fafc; }
    .group-subtitle { font-size: 0.75rem; color: #94a3b8; margin-top: 0.125rem; }
    .chevron { width: 1.25rem; height: 1.25rem; color: #94a3b8; transition: transform 0.2s ease; }
    details[open] .chevron { transform: rotate(180deg); }
    .items-grid {
      padding: 1rem;
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      border-top: 1px solid rgba(30, 41, 59, 0.8);
    }
    @media (min-width: 640px) { .items-grid { grid-template-columns: repeat(2, 1fr); } }
    .saga-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid #1e293b;
      background: rgba(2, 6, 23, 0.5);
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .saga-item.checked { background: rgba(2, 6, 23, 0.95); border-color: #334155; }
    .saga-checkbox { width: 1rem; height: 1rem; accent-color: #facc15; cursor: pointer; flex-shrink: 0; }
    .saga-img { width: 3rem; height: 4.5rem; border-radius: 0.5rem; object-fit: cover; background: #1e293b; flex-shrink: 0; border: 1px solid #1e293b; }
    .saga-body { flex: 1; min-width: 0; }
    .saga-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .saga-name { font-size: 0.8rem; font-weight: 600; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .saga-badge { font-size: 0.65rem; font-weight: 600; padding: 0.125rem 0.375rem; border-radius: 0.25rem; border: 1px solid; flex-shrink: 0; }
    .badge-simpsons { border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.1); color: #fde047; }
    .badge-futurama { border-color: rgba(52, 211, 153, 0.4); background: rgba(52, 211, 153, 0.1); color: #6ee7b7; }
    .badge-crossover { border-color: rgba(168, 85, 247, 0.4); background: rgba(168, 85, 247, 0.1); color: #d8b4fe; }
    .saga-desc { font-size: 0.7rem; color: #94a3b8; margin-top: 0.2rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.25; }
    .footer {
      position: sticky;
      bottom: 1rem;
      background: rgba(15, 23, 42, 0.96);
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 1rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(12px);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .footer-text { font-size: 0.875rem; font-weight: 700; color: #e2e8f0; }
    .footer-desc { font-size: 0.75rem; color: #94a3b8; }
    .footer-btns { display: flex; align-items: center; gap: 0.75rem; }
    .btn-copy { background: #1e293b; color: #f8fafc; border: 1px solid #334155; padding: 0.625rem 1rem; border-radius: 0.75rem; font-size: 0.75rem; font-weight: 600; cursor: pointer; transition: background 0.15s ease; }
    .btn-copy:hover { background: #334155; }
    .btn-install {
      background: linear-gradient(to right, #facc15, #34d399);
      color: #020617;
      text-decoration: none;
      padding: 0.625rem 1.25rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 700;
      display: inline-block;
      transition: opacity 0.15s ease;
    }
    .btn-install:hover { opacity: 0.95; }
  </style>
</head>
<body>
  <div class="container">
    <header class="header text-center">
      <h1 class="title">SPRINGFIELD 3000 <span style="font-size: 0.875rem; vertical-align: middle; margin-left: 0.5rem; background: #1e293b; color: #38bdf8; border: 1px solid #0284c7; padding: 0.2rem 0.6rem; border-radius: 9999px; letter-spacing: normal; -webkit-text-fill-color: initial;">v${escHtml(version)}</span></h1>
      <p id="ui-subtitle" class="subtitle"></p>
    </header>

    <section class="card">
      <div class="flex-between">
        <div class="btn-group">
          <button type="button" data-lang="en" class="btn-lang active">🇺🇸 English</button>
          <button type="button" data-lang="es" class="btn-lang">🇪🇸 Español</button>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span id="selection-counter" class="counter"></span>
          <button type="button" id="btn-select-all" class="btn-action"></button>
          <button type="button" id="btn-select-none" class="btn-action"></button>
        </div>
      </div>
    </section>

    <main id="accordions-root"></main>

    <footer class="footer">
      <div>
        <div id="ui-ready-title" class="footer-text"></div>
        <div id="ui-ready-desc" class="footer-desc"></div>
      </div>
      <div class="footer-btns">
        <button type="button" id="btn-copy" class="btn-copy"></button>
        <a id="btn-install" href="#" class="btn-install"></a>
      </div>
    </footer>
  </div>

  <script${nonceAttr}>
    const SAGAS_DATA = ${safeJson(clientSagasPayload)};
    const INITIAL_CONFIG = ${safeJson(defaultConfig)};
    const CURRENT_VERSION = ${safeJson(version)};
    const COUNTS = {
      simpsons: ${simpsonsCount},
      futurama: ${futuramaCount},
      crossover: ${crossoverCount}
    };

    function esc(s) {
      return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    const I18N = {
      en: {
        subtitle: 'Binge-watch the best of The Simpsons & Futurama in curated sagas and story arcs.',
        selectAll: 'Select All',
        selectNone: 'Clear All',
        copyBtn: '📋 Copy Link',
        copiedBtn: '✅ Copied!',
        installBtn: '🚀 Install Addon',
        selectAtLeastOne: '⚠️ Select at least 1 saga',
        readyTitle: 'Ready to watch',
        readyDesc: 'Click Install to open in Stremio. (If already installed, uninstall it first in My Addons to force poster refresh).',
        selectedCount: (n, total) => n + ' of ' + total + ' selected',
        episodesBadge: (n) => n + ' ep',
        groups: {
          simpsons: {
            title: '🍩 The Simpsons',
            subtitle: COUNTS.simpsons + ' Curated sagas, character arcs & Halloween specials',
            badgeClass: 'badge-simpsons'
          },
          futurama: {
            title: '🚀 Futurama',
            subtitle: COUNTS.futurama + ' Sci-Fi story arcs, time paradoxes & Hulu revival',
            badgeClass: 'badge-futurama'
          },
          crossover: {
            title: '🌀 Official Crossover',
            subtitle: 'Springfield meets the 31st Century',
            badgeClass: 'badge-crossover'
          }
        }
      },
      es: {
        subtitle: 'Disfruta lo mejor de Los Simpson y Futurama en sagas temáticas y arcos correlativos.',
        selectAll: 'Seleccionar Todo',
        selectNone: 'Limpiar',
        copyBtn: '📋 Copiar Enlace',
        copiedBtn: '✅ ¡Copiado!',
        installBtn: '🚀 Instalar Addon',
        selectAtLeastOne: '⚠️ Selecciona al menos 1 saga',
        readyTitle: 'Listo para ver',
        readyDesc: 'Haz clic en Instalar para abrir en Stremio. (Si ya lo tenías instalado, desinstálalo primero en Mis Addons para refrescar las carátulas).',
        selectedCount: (n, total) => n + ' de ' + total + ' activas',
        episodesBadge: (n) => n + ' ep',
        groups: {
          simpsons: {
            title: '🍩 Los Simpson',
            subtitle: COUNTS.simpsons + ' Sagas temáticas, arcos de personajes y especiales de Halloween',
            badgeClass: 'badge-simpsons'
          },
          futurama: {
            title: '🚀 Futurama',
            subtitle: COUNTS.futurama + ' Arcos de ciencia ficción, paradojas y la era Hulu',
            badgeClass: 'badge-futurama'
          },
          crossover: {
            title: '🌀 Crossover Oficial',
            subtitle: 'Springfield y el siglo 31 se unen',
            badgeClass: 'badge-crossover'
          }
        }
      }
    };

    let state = {
      lang: INITIAL_CONFIG.lang === 'es' ? 'es' : 'en',
      selected: new Set(INITIAL_CONFIG.sagas)
    };

    let manifestUrl = '';

    function encodeConfigBase64Url(configObj) {
      const json = JSON.stringify(configObj);
      const bytes = new TextEncoder().encode(json);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\\+/g, '-').replace(/\\//g, '_').replace(/=+$/, '');
    }

    function updateUrlsAndCounters() {
      const t = I18N[state.lang];
      const orderedIds = SAGAS_DATA.map(s => s.id).filter(id => state.selected.has(id));
      const installBtn = document.getElementById('btn-install');
      const copyBtn = document.getElementById('btn-copy');

      if (orderedIds.length === 0) {
        manifestUrl = '';
        installBtn.removeAttribute('href');
        installBtn.textContent = t.selectAtLeastOne;
        installBtn.style.opacity = '0.5';
        installBtn.style.pointerEvents = 'none';
        copyBtn.style.opacity = '0.5';
        copyBtn.style.pointerEvents = 'none';
      } else {
        const payload = {
          lang: state.lang,
          sagas: orderedIds,
          v: CURRENT_VERSION
        };
        const encoded = encodeConfigBase64Url(payload);
        const host = window.location.host;
        const protocol = window.location.protocol;
        manifestUrl = protocol + '//' + host + '/' + encoded + '/manifest.json?v=' + CURRENT_VERSION;
        const stremioManifest = 'stremio://' + host + '/' + encoded + '/manifest.json?v=' + CURRENT_VERSION;

        installBtn.href = stremioManifest;
        installBtn.textContent = t.installBtn;
        installBtn.style.opacity = '1';
        installBtn.style.pointerEvents = 'auto';
        copyBtn.style.opacity = '1';
        copyBtn.style.pointerEvents = 'auto';
      }

      document.getElementById('selection-counter').textContent = t.selectedCount(
        orderedIds.length,
        SAGAS_DATA.length
      );
    }

    function renderAccordions() {
      const t = I18N[state.lang];
      document.getElementById('ui-subtitle').textContent = t.subtitle;
      document.getElementById('btn-select-all').textContent = t.selectAll;
      document.getElementById('btn-select-none').textContent = t.selectNone;
      document.getElementById('ui-ready-title').textContent = t.readyTitle;
      document.getElementById('ui-ready-desc').textContent = t.readyDesc;
      document.getElementById('btn-copy').textContent = t.copyBtn;

      document.querySelectorAll('.btn-lang').forEach(btn => {
        const isCurrent = btn.getAttribute('data-lang') === state.lang;
        btn.className = 'btn-lang' + (isCurrent ? ' active' : '');
      });

      const root = document.getElementById('accordions-root');
      root.innerHTML = '';

      ['simpsons', 'futurama', 'crossover'].forEach((universeKey) => {
        const groupInfo = t.groups[universeKey];
        const items = SAGAS_DATA.filter(s => s.universe === universeKey);

        const details = document.createElement('details');
        details.open = true;
        details.className = 'group-details';

        const summary = document.createElement('summary');
        summary.className = 'group-summary';
        summary.innerHTML =
          '<div>' +
            '<h2 class="group-title">' + esc(groupInfo.title) + '</h2>' +
            '<p class="group-subtitle">' + esc(groupInfo.subtitle) + '</p>' +
          '</div>' +
          '<svg class="chevron" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
            '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />' +
          '</svg>';

        const grid = document.createElement('div');
        grid.className = 'items-grid';

        items.forEach(saga => {
          const isChecked = state.selected.has(saga.id);
          const label = document.createElement('label');
          label.className = 'saga-item' + (isChecked ? ' checked' : '');

          const title = saga.name[state.lang];
          const desc = saga.description[state.lang];

          label.innerHTML =
            '<input type="checkbox" data-saga-id="' + esc(saga.id) + '" ' + (isChecked ? 'checked' : '') + ' class="saga-checkbox" />' +
            '<img src="/poster/' + esc(state.lang) + '/' + esc(saga.id) + '.jpg" alt="' + esc(title) + '" class="saga-img" loading="lazy" />' +
            '<div class="saga-body">' +
              '<div class="saga-header">' +
                '<span class="saga-name">' + esc(title) + '</span>' +
                '<span class="saga-badge ' + esc(groupInfo.badgeClass) + '">' + esc(t.episodesBadge(saga.episodeCount)) + '</span>' +
              '</div>' +
              '<p class="saga-desc">' + esc(desc) + '</p>' +
            '</div>';

          const checkbox = label.querySelector('input');
          checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
              state.selected.add(saga.id);
              label.classList.add('checked');
            } else {
              state.selected.delete(saga.id);
              label.classList.remove('checked');
            }
            updateUrlsAndCounters();
          });

          grid.appendChild(label);
        });

        details.appendChild(summary);
        details.appendChild(grid);
        root.appendChild(details);
      });

      updateUrlsAndCounters();
    }

    function syncCheckboxes() {
      document.querySelectorAll('.saga-checkbox').forEach(cb => {
        const sagaId = cb.getAttribute('data-saga-id');
        const isChecked = state.selected.has(sagaId);
        cb.checked = isChecked;
        const parent = cb.closest('.saga-item');
        if (parent) {
          parent.classList.toggle('checked', isChecked);
        }
      });
      updateUrlsAndCounters();
    }

    document.querySelectorAll('.btn-lang').forEach(btn => {
      btn.addEventListener('click', () => {
        state.lang = btn.getAttribute('data-lang');
        renderAccordions();
      });
    });

    document.getElementById('btn-select-all').addEventListener('click', () => {
      SAGAS_DATA.forEach(s => state.selected.add(s.id));
      syncCheckboxes();
    });

    document.getElementById('btn-select-none').addEventListener('click', () => {
      state.selected.clear();
      syncCheckboxes();
    });

    document.getElementById('btn-copy').addEventListener('click', async () => {
      if (!manifestUrl) return;
      const copyBtn = document.getElementById('btn-copy');
      try {
        await navigator.clipboard.writeText(manifestUrl);
        copyBtn.textContent = I18N[state.lang].copiedBtn;
        setTimeout(() => {
          copyBtn.textContent = I18N[state.lang].copyBtn;
        }, 2000);
      } catch {
        // Ignore clipboard permission denial
      }
    });

    renderAccordions();
  </script>
</body>
</html>`;
}

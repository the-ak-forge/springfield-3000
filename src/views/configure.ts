import { SAGAS } from '../data/sagas';
import { UserConfig } from '../types';

export function renderConfigurePage(initialConfig?: UserConfig): string {
  const defaultConfig: UserConfig = initialConfig ?? {
    lang: 'en',
    sagas: SAGAS.map((s) => s.id),
  };

  const clientSagasPayload = SAGAS.map((s) => ({
    id: s.id,
    universe: s.universe,
    name: s.name,
    description: s.description,
    poster: s.poster,
    episodeCount: s.episodes.length,
  }));

  return `<!DOCTYPE html>
<html lang="${defaultConfig.lang}" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Springfield 3000 — Addon Configurator</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            simpsons: '#FED90F',
            futurama: '#2CE8B5',
          }
        }
      }
    };
  </script>
  <style>
    details > summary { list-style: none; }
    details > summary::-webkit-details-marker { display: none; }
    details[open] summary .chevron { transform: rotate(180deg); }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen selection:bg-yellow-400 selection:text-slate-950 antialiased">
  <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
    <!-- Header -->
    <header class="text-center mb-8">
      <h1 class="text-3xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">
        SPRINGFIELD 3000
      </h1>
      <p id="ui-subtitle" class="mt-2 text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed"></p>
    </header>

    <!-- Controls Bar -->
    <section class="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 mb-6 shadow-lg backdrop-blur">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
        <!-- Language Selector -->
        <div class="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button type="button" data-lang="en" class="lang-btn px-4 py-1.5 rounded-lg text-sm font-semibold transition">
            🇺🇸 English
          </button>
          <button type="button" data-lang="es" class="lang-btn px-4 py-1.5 rounded-lg text-sm font-semibold transition">
            🇪🇸 Español
          </button>
        </div>

        <!-- Quick Selection Actions -->
        <div class="flex items-center gap-2">
          <span id="selection-counter" class="text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg"></span>
          <button type="button" id="btn-select-all" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"></button>
          <button type="button" id="btn-select-none" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"></button>
        </div>
      </div>
    </section>

    <!-- Accordions Container -->
    <main id="accordions-root" class="space-y-4 mb-10"></main>

    <!-- Sticky Install Footer Card -->
    <footer class="sticky bottom-4 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div class="text-left w-full sm:w-auto">
          <div id="ui-ready-title" class="text-sm font-bold text-slate-200"></div>
          <p id="ui-ready-desc" class="text-xs text-slate-400"></p>
        </div>
        <div class="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            id="btn-copy"
            class="px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition shrink-0"
          ></button>
          <a
            id="btn-install"
            href="#"
            class="px-6 py-2.5 rounded-xl font-bold text-sm text-center bg-gradient-to-r from-yellow-400 to-emerald-400 text-slate-950 hover:opacity-95 shadow-md shadow-yellow-500/10 transition shrink-0"
          ></a>
        </div>
      </div>
    </footer>
  </div>

  <script>
    const SAGAS_DATA = ${JSON.stringify(clientSagasPayload)};
    const INITIAL_CONFIG = ${JSON.stringify(defaultConfig)};

    const I18N = {
      en: {
        subtitle: 'Binge-watch the best of The Simpsons & Futurama in curated sagas and story arcs.',
        selectAll: 'Select All',
        selectNone: 'Clear All',
        copyBtn: '📋 Copy Link',
        copiedBtn: '✅ Copied!',
        installBtn: '🚀 Install Addon',
        readyTitle: 'Ready to watch',
        readyDesc: 'Click Install to open in Stremio and start playing.',
        selectedCount: (n, total) => \`\${n} of \${total} selected\`,
        episodesBadge: (n) => \`\${n} ep\`,
        groups: {
          simpsons: {
            title: '🍩 The Simpsons',
            subtitle: '16 Curated sagas, character arcs & Halloween specials',
            badge: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
          },
          futurama: {
            title: '🚀 Futurama',
            subtitle: '15 Sci-Fi story arcs, time paradoxes & Hulu revival',
            badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          },
          crossover: {
            title: '🌀 Official Crossover',
            subtitle: 'Springfield meets the 31st Century',
            badge: 'border-purple-500/40 bg-purple-500/10 text-purple-300'
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
        readyTitle: 'Listo para ver',
        readyDesc: 'Haz clic en Instalar para abrir en Stremio y disfrutar.',
        selectedCount: (n, total) => \`\${n} de \${total} activas\`,
        episodesBadge: (n) => \`\${n} ep\`,
        groups: {
          simpsons: {
            title: '🍩 Los Simpson',
            subtitle: '16 Sagas temáticas, arcos de personajes y especiales de Halloween',
            badge: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300'
          },
          futurama: {
            title: '🚀 Futurama',
            subtitle: '15 Arcos de ciencia ficción, paradojas y la era Hulu',
            badge: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
          },
          crossover: {
            title: '🌀 Crossover Oficial',
            subtitle: 'Springfield y el siglo 31 se unen',
            badge: 'border-purple-500/40 bg-purple-500/10 text-purple-300'
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
      const payload = {
        lang: state.lang,
        sagas: orderedIds
      };
      const encoded = encodeConfigBase64Url(payload);
      const host = window.location.host;
      const protocol = window.location.protocol;
      manifestUrl = \`\${protocol}//\${host}/\${encoded}/manifest.json\`;
      const stremioManifest = \`stremio://\${host}/\${encoded}/manifest.json\`;

      const installBtn = document.getElementById('btn-install');
      installBtn.href = stremioManifest;
      installBtn.textContent = t.installBtn;

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

      document.querySelectorAll('.lang-btn').forEach(btn => {
        const isCurrent = btn.getAttribute('data-lang') === state.lang;
        btn.className = 'lang-btn px-4 py-1.5 rounded-lg text-sm font-semibold transition ' +
          (isCurrent ? 'bg-yellow-400 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200');
      });

      const root = document.getElementById('accordions-root');
      root.innerHTML = '';

      ['simpsons', 'futurama', 'crossover'].forEach((universeKey) => {
        const groupInfo = t.groups[universeKey];
        const items = SAGAS_DATA.filter(s => s.universe === universeKey);

        const details = document.createElement('details');
        details.open = true;
        details.className = 'group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-md';

        const summary = document.createElement('summary');
        summary.className = 'cursor-pointer select-none p-4 flex items-center justify-between gap-4 bg-slate-900 hover:bg-slate-800/80 transition';
        summary.innerHTML = \`
          <div>
            <h2 class="text-base md:text-lg font-bold text-slate-100">\${groupInfo.title}</h2>
            <p class="text-xs text-slate-400 mt-0.5">\${groupInfo.subtitle}</p>
          </div>
          <svg class="chevron w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        \`;

        const grid = document.createElement('div');
        grid.className = 'p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-800/80';

        items.forEach(saga => {
          const isChecked = state.selected.has(saga.id);
          const label = document.createElement('label');
          label.className = \`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition \${
            isChecked
              ? 'bg-slate-950/90 border-slate-700 hover:border-slate-500'
              : 'bg-slate-950/40 border-slate-900 opacity-50 hover:opacity-80'
          }\`;

          label.innerHTML = \`
            <input
              type="checkbox"
              data-saga-id="\${saga.id}"
              \${isChecked ? 'checked' : ''}
              class="h-4 w-4 rounded border-slate-700 bg-slate-900 text-yellow-400 focus:ring-yellow-400 shrink-0"
            />
            <img
              src="\${saga.poster}"
              alt="\${saga.name[state.lang]}"
              class="w-16 h-12 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-800"
              loading="lazy"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-semibold text-xs md:text-sm text-slate-100 truncate">\${saga.name[state.lang]}</span>
                <span class="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded border \${groupInfo.badge}">
                  \${t.episodesBadge(saga.episodeCount)}
                </span>
              </div>
              <p class="text-[11px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">\${saga.description[state.lang]}</p>
            </div>
          \`;

          const checkbox = label.querySelector('input');
          checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
              state.selected.add(saga.id);
            } else {
              state.selected.delete(saga.id);
            }
            renderAccordions();
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

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.lang = btn.getAttribute('data-lang');
        renderAccordions();
      });
    });

    document.getElementById('btn-select-all').addEventListener('click', () => {
      SAGAS_DATA.forEach(s => state.selected.add(s.id));
      renderAccordions();
    });

    document.getElementById('btn-select-none').addEventListener('click', () => {
      state.selected.clear();
      renderAccordions();
    });

    document.getElementById('btn-copy').addEventListener('click', async () => {
      const copyBtn = document.getElementById('btn-copy');
      await navigator.clipboard.writeText(manifestUrl);
      copyBtn.textContent = I18N[state.lang].copiedBtn;
      setTimeout(() => {
        copyBtn.textContent = I18N[state.lang].copyBtn;
      }, 2000);
    });

    renderAccordions();
  </script>
</body>
</html>`;
}

import { SAGAS, SAGAS_BY_ID } from './data/sagas';
import {
  Language,
  SagaDefinition,
  StremioManifest,
  StremioMetaDetail,
  StremioMetaPreview,
  StremioVideo,
  UserConfig,
} from './types';
import { renderConfigurePage } from './views/configure';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const CACHE_CONTROL_META = 'max-age=86400, stale-while-revalidate=43200';

/**
 * Decodes URL-safe Base64 user configuration segment.
 * Falls back to all sagas in English ('en') if missing or malformed.
 */
export function decodeConfig(rawSegment?: string): UserConfig {
  const fallback: UserConfig = {
    lang: 'en',
    sagas: SAGAS.map((s) => s.id),
  };

  if (!rawSegment || rawSegment === 'default') {
    return fallback;
  }

  try {
    const base64 = rawSegment.replace(/-/g, '+').replace(/_/g, '/');
    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + '='.repeat(padLength);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const jsonStr = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(jsonStr) as Partial<UserConfig>;

    const lang: Language = parsed.lang === 'es' ? 'es' : 'en';
    const validSagas = Array.isArray(parsed.sagas)
      ? parsed.sagas.filter((id): id is string => typeof id === 'string' && Boolean(SAGAS_BY_ID[id]))
      : fallback.sagas;

    return {
      lang,
      sagas: validSagas,
    };
  } catch {
    return fallback;
  }
}

function buildManifest(config: UserConfig): StremioManifest {
  const isEn = config.lang === 'en';
  const activeSagas = config.sagas
    .map((id) => SAGAS_BY_ID[id])
    .filter((s): s is SagaDefinition => Boolean(s));

  const hasSimpsons = activeSagas.some((s) => s.universe === 'simpsons');
  const hasFuturama = activeSagas.some((s) => s.universe === 'futurama');
  const hasCrossover = activeSagas.some((s) => s.universe === 'crossover');

  const catalogs: StremioManifest['catalogs'] = [
    {
      type: 'series',
      id: 'springfield3000-all',
      name: isEn ? 'Springfield 3000: All Curated Sagas' : 'Springfield 3000: Todas las Sagas',
    },
  ];

  if (hasSimpsons) {
    catalogs.push({
      type: 'series',
      id: 'springfield3000-simpsons',
      name: isEn ? 'The Simpsons — Sagas & Anthologies' : 'Los Simpson — Sagas y Antologías',
    });
  }

  if (hasFuturama) {
    catalogs.push({
      type: 'series',
      id: 'springfield3000-futurama',
      name: isEn ? 'Futurama — Sci-Fi Arcs & Lore' : 'Futurama — Arcos y Lore Sci-Fi',
    });
  }

  if (hasCrossover) {
    catalogs.push({
      type: 'series',
      id: 'springfield3000-crossover',
      name: isEn ? 'Springfield × 3000 Crossover' : 'Crossover Springfield × 3000',
    });
  }

  return {
    id: 'org.springfield3000.curated.addon',
    version: '1.0.0',
    name: 'Springfield 3000',
    description: isEn
      ? 'Curated thematic collections, chronological character arcs, and complete anthologies for The Simpsons (tt0096697) & Futurama (tt0149460). Updated through Oct 2026.'
      : 'Colecciones temáticas curadas, arcos narrativos correlativos y antologías completas de Los Simpson (tt0096697) y Futurama (tt0149460). Actualizado a Octubre 2026.',
    logo: 'https://images.metahub.space/logo/medium/tt0096697/img',
    background: 'https://images.metahub.space/background/medium/tt0149460/img',
    types: ['series'],
    catalogs,
    resources: [
      'catalog',
      {
        name: 'meta',
        types: ['series'],
        idPrefixes: ['simpsons-', 'futurama-', 'crossover-'],
      },
    ],
    idPrefixes: ['simpsons-', 'futurama-', 'crossover-'],
    behaviorHints: {
      configurable: true,
      configurationRequired: false,
    },
  };
}

function toMetaPreview(saga: SagaDefinition, lang: Language): StremioMetaPreview {
  return {
    id: saga.id,
    type: 'series',
    name: saga.name[lang],
    poster: saga.poster,
    posterShape: 'poster',
    background: saga.background,
    description: saga.description[lang],
    releaseInfo: saga.releaseInfo,
    imdbRating: saga.imdbRating,
    genres: saga.genres,
  };
}

function toMetaDetail(saga: SagaDefinition, lang: Language): StremioMetaDetail {
  const prefixTag = lang === 'en' ? 'S' : 'T';

  const videos: StremioVideo[] = saga.episodes.map((ep, index) => {
    const showImdb = ep.imdbId ?? saga.defaultImdbId;
    const canonicalVideoId = `${showImdb}:${ep.season}:${ep.episode}`;
    const codeLabel = `${prefixTag}${String(ep.season).padStart(2, '0')}E${String(ep.episode).padStart(2, '0')}`;

    // Synthetic chronological release date so Stremio preserves exact saga order
    const releasedDate = new Date(Date.UTC(2000, 0, index + 1)).toISOString();

    return {
      id: canonicalVideoId,
      title: `[${codeLabel}] ${ep.title[lang]}`,
      season: 1,
      episode: index + 1,
      released: ep.released ?? releasedDate,
      overview:
        ep.overview?.[lang] ??
        (lang === 'en'
          ? `${saga.name.en} — Original episode ${codeLabel} (${showImdb}:${ep.season}:${ep.episode}).`
          : `${saga.name.es} — Episodio original ${codeLabel} (${showImdb}:${ep.season}:${ep.episode}).`),
      thumbnail: `https://episodes.metahub.space/${showImdb}/${ep.season}/${ep.episode}/w780.jpg`,
    };
  });

  return {
    ...toMetaPreview(saga, lang),
    videos,
  };
}

function jsonResponse(data: unknown, cacheControl = CACHE_CONTROL_META, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      ...CORS_HEADERS,
    },
  });
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...CORS_HEADERS,
    },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';

    // 1. Root & Configure UI Routes
    if (path === '/' || path === '/configure') {
      return htmlResponse(renderConfigurePage());
    }

    const configUiMatch = path.match(/^\/([^/]+)\/configure$/);
    if (configUiMatch) {
      const userConfig = decodeConfig(configUiMatch[1]);
      return htmlResponse(renderConfigurePage(userConfig));
    }

    // 2. Manifest Routes (/manifest.json or /:config/manifest.json)
    if (path === '/manifest.json') {
      const defaultConfig = decodeConfig();
      return jsonResponse(buildManifest(defaultConfig), 'max-age=3600');
    }

    const manifestMatch = path.match(/^\/([^/]+)\/manifest\.json$/);
    if (manifestMatch) {
      const userConfig = decodeConfig(manifestMatch[1]);
      return jsonResponse(buildManifest(userConfig), 'max-age=3600');
    }

    // 3. Catalog Routes (/:config/catalog/series/:catalogId.json or /catalog/series/:catalogId.json)
    const catalogMatch =
      path.match(/^\/([^/]+)\/catalog\/series\/([^/.]+)(?:\/[^/.]+)?\.json$/) ??
      path.match(/^\/catalog\/series\/([^/.]+)(?:\/[^/.]+)?\.json$/);

    if (catalogMatch) {
      const hasConfigSegment = catalogMatch.length === 3;
      const userConfig = hasConfigSegment ? decodeConfig(catalogMatch[1]) : decodeConfig();
      const catalogId = hasConfigSegment ? catalogMatch[2] : catalogMatch[1];

      let activeSagas = userConfig.sagas
        .map((id) => SAGAS_BY_ID[id])
        .filter((s): s is SagaDefinition => Boolean(s));

      if (catalogId === 'springfield3000-simpsons') {
        activeSagas = activeSagas.filter((s) => s.universe === 'simpsons');
      } else if (catalogId === 'springfield3000-futurama') {
        activeSagas = activeSagas.filter((s) => s.universe === 'futurama');
      } else if (catalogId === 'springfield3000-crossover') {
        activeSagas = activeSagas.filter((s) => s.universe === 'crossover');
      }

      const metas: StremioMetaPreview[] = activeSagas.map((saga) =>
        toMetaPreview(saga, userConfig.lang)
      );

      return jsonResponse({ metas }, CACHE_CONTROL_META);
    }

    // 4. Meta Detail Routes (/:config/meta/series/:id.json or /meta/series/:id.json)
    const metaMatch =
      path.match(/^\/([^/]+)\/meta\/series\/([^/.]+)\.json$/) ??
      path.match(/^\/meta\/series\/([^/.]+)\.json$/);

    if (metaMatch) {
      const hasConfigSegment = metaMatch.length === 3;
      const userConfig = hasConfigSegment ? decodeConfig(metaMatch[1]) : decodeConfig();
      const sagaId = hasConfigSegment ? metaMatch[2] : metaMatch[1];

      const saga = SAGAS_BY_ID[sagaId];
      if (!saga) {
        return jsonResponse({ meta: null, error: 'Saga not found' }, 'no-store', 404);
      }

      const meta = toMetaDetail(saga, userConfig.lang);
      return jsonResponse({ meta }, CACHE_CONTROL_META);
    }

    return jsonResponse(
      {
        error: 'Not Found',
        message: 'Visit /configure to customize and install the Springfield 3000 Stremio Addon.',
      },
      'no-store',
      404
    );
  },
};

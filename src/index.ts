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

export const ADDON_VERSION = '1.0.4';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const HTML_SECURITY_HEADERS: Record<string, string> = {
  ...SECURITY_HEADERS,
  'Content-Security-Policy':
    "default-src 'self'; img-src * data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; frame-ancestors 'none';",
};

const CACHE_CONTROL_META = 'public, max-age=21600, stale-while-revalidate=7200';
const CACHE_CONTROL_MANIFEST = 'public, max-age=3600, stale-while-revalidate=1800';

export function safeDecodePath(pathname: string): string {
  try {
    return decodeURIComponent(pathname).replace(/\/+$/, '') || '/';
  } catch {
    return pathname.replace(/\/+$/, '') || '/';
  }
}

/**
 * Decodes URL-safe Base64 user configuration segment.
 * Falls back to all sagas in English ('en') if missing, empty, or malformed.
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

    // Safe lookup using Map to prevent prototype pollution and deduplicate
    const rawSagas = Array.isArray(parsed.sagas) ? parsed.sagas : [];
    const validSagas = [
      ...new Set(
        rawSagas.filter(
          (id): id is string => typeof id === 'string' && SAGAS_BY_ID.has(id)
        )
      ),
    ];

    // If configuration results in 0 valid sagas, fall back to all sagas
    return {
      lang,
      sagas: validSagas.length > 0 ? validSagas : fallback.sagas,
    };
  } catch {
    return fallback;
  }
}

export function buildManifest(config: UserConfig): StremioManifest {
  const isEn = config.lang === 'en';

  const catalogs: StremioManifest['catalogs'] = [
    {
      type: 'series',
      id: 'springfield3000-all',
      name: 'Springfield 3000',
    },
  ];

  return {
    id: 'org.springfield3000.curated.addon',
    version: ADDON_VERSION,
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
    stremioAddonsConfig: {
      issuer: 'https://stremio-addons.net',
      signature:
        'eyJhbGciOiJkaXIiLCJlbmMiOiJBMTI4Q0JDLUhTMjU2In0..9RD_vDdhdzNkUVTWv-mHmw.EjXq7IDEle-w9UavH2Bnh3NzF_SX7c1wMHUpIQArJkJ03azC2ezpAS2YWUejlbWCs4dLKfsOmLp0z5q5seW34MWZxGdcfFe3E0DO4dWyzSgzI_gdQC7WBmztzoApDJq7.wm6OuwAeCIwoXKvBfKK2-Q',
    },
  };
}

export function toMetaPreview(saga: SagaDefinition, lang: Language): StremioMetaPreview {
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

export function toMetaDetail(saga: SagaDefinition, lang: Language): StremioMetaDetail {
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

export function jsonResponse(
  data: unknown,
  cacheControl = CACHE_CONTROL_META,
  status = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      ...CORS_HEADERS,
      ...SECURITY_HEADERS,
    },
  });
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      ...HTML_SECURITY_HEADERS,
    },
  });
}

export default {
  async fetch(
    request: Request,
    _env: unknown,
    ctx?: { waitUntil: (promise: Promise<unknown>) => void }
  ): Promise<Response> {
    try {
      // 1. CORS Preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            ...CORS_HEADERS,
            ...SECURITY_HEADERS,
          },
        });
      }

      // 2. HTTP Method Validation (Only GET, HEAD, OPTIONS allowed)
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(
          JSON.stringify({ error: 'Method Not Allowed' }),
          {
            status: 405,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              Allow: 'GET, HEAD, OPTIONS',
              ...CORS_HEADERS,
              ...SECURITY_HEADERS,
            },
          }
        );
      }

      const url = new URL(request.url);
      const path = safeDecodePath(url.pathname);

      // 3. Edge Cache Lookup with Version Key (Prevents stale responses across deploys)
      const cache = typeof caches !== 'undefined' ? (caches as unknown as { default?: Cache }).default : undefined;
      const cacheKeyUrl = new URL(request.url);
      cacheKeyUrl.searchParams.set('addon_ver', ADDON_VERSION);
      const cacheKey = new Request(cacheKeyUrl.toString(), request);

      if (cache && request.method === 'GET' && !path.endsWith('/configure') && path !== '/') {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
          return cachedResponse;
        }
      }

      let response: Response;
      let m: RegExpMatchArray | null;

      // 4. Flat Route Dispatcher (Single-pass regex matching)
      // 4.1 Configure Page
      if (path === '/' || path === '/configure') {
        response = htmlResponse(renderConfigurePage());
      } else if ((m = path.match(/^\/([^/]+)\/configure$/))) {
        const userConfig = decodeConfig(m[1]);
        response = htmlResponse(renderConfigurePage(userConfig));
      }
      // 4.2 Manifest Routes
      else if (path === '/manifest.json') {
        const defaultConfig = decodeConfig();
        response = jsonResponse(buildManifest(defaultConfig), CACHE_CONTROL_MANIFEST);
      } else if ((m = path.match(/^\/([^/]+)\/manifest\.json$/))) {
        const userConfig = decodeConfig(m[1]);
        response = jsonResponse(buildManifest(userConfig), CACHE_CONTROL_MANIFEST);
      }
      // 4.3 Catalog Routes (supports optional extras with dots e.g. search=foo)
      else if (
        (m =
          path.match(/^\/([^/]+)\/catalog\/series\/([^/]+?)(?:\/([^/]+))?\.json$/) ??
          path.match(/^\/catalog\/series\/([^/]+?)(?:\/([^/]+))?\.json$/))
      ) {
        const hasConfigSegment = m.length === 4;
        const userConfig = hasConfigSegment ? decodeConfig(m[1]) : decodeConfig();
        const catalogId = hasConfigSegment ? m[2] : m[1];

        const allowedCatalogs = new Set([
          'springfield3000-all',
          'springfield3000-simpsons',
          'springfield3000-futurama',
          'springfield3000-crossover',
        ]);

        if (!allowedCatalogs.has(catalogId)) {
          response = jsonResponse({ metas: [], error: 'Catalog not found' }, 'no-store', 404);
        } else {
          let activeSagas = userConfig.sagas
            .map((id) => SAGAS_BY_ID.get(id))
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

          response = jsonResponse({ metas }, CACHE_CONTROL_META);
        }
      }
      // 4.4 Meta Detail Routes
      else if (
        (m =
          path.match(/^\/([^/]+)\/meta\/series\/([^/.]+)\.json$/) ??
          path.match(/^\/meta\/series\/([^/.]+)\.json$/))
      ) {
        const hasConfigSegment = m.length === 3;
        const userConfig = hasConfigSegment ? decodeConfig(m[1]) : decodeConfig();
        const sagaId = hasConfigSegment ? m[2] : m[1];

        const saga = SAGAS_BY_ID.get(sagaId);
        if (!saga) {
          response = jsonResponse({ meta: null, error: 'Saga not found' }, 'no-store', 404);
        } else {
          const meta = toMetaDetail(saga, userConfig.lang);
          response = jsonResponse({ meta }, CACHE_CONTROL_META);
        }
      }
      // 4.5 Fallback 404
      else {
        response = jsonResponse(
          {
            error: 'Not Found',
            message: 'Visit /configure to customize and install the Springfield 3000 Stremio Addon.',
          },
          'no-store',
          404
        );
      }

      // 5. Save in Edge Cache if cacheable
      if (
        cache &&
        request.method === 'GET' &&
        response.status === 200 &&
        ctx &&
        typeof ctx.waitUntil === 'function' &&
        !path.endsWith('/configure') &&
        path !== '/'
      ) {
        ctx.waitUntil(cache.put(cacheKey, response.clone()));
      }

      return response;
    } catch (err: unknown) {
      console.error('Unhandled Worker error:', err);
      return jsonResponse(
        {
          error: 'Internal Server Error',
          message: err instanceof Error ? err.message : 'Unknown error',
        },
        'no-store',
        500
      );
    }
  },
};

import { describe, expect, it } from 'vitest';
import { SAGAS, SAGAS_BY_ID } from '../src/data/sagas';
import worker, {
  ADDON_VERSION,
  decodeConfig,
  safeDecodePath,
} from '../src/index';

function toBase64Url(obj: unknown): string {
  const json = JSON.stringify(obj);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

describe('Springfield 3000 Data Integrity', () => {
  it('should have exactly 31 curated sagas', () => {
    expect(SAGAS.length).toBe(31);
    expect(SAGAS_BY_ID.size).toBe(31);

    const simpsons = SAGAS.filter((s) => s.universe === 'simpsons');
    const futurama = SAGAS.filter((s) => s.universe === 'futurama');
    const crossover = SAGAS.filter((s) => s.universe === 'crossover');

    expect(simpsons.length).toBe(16);
    expect(futurama.length).toBe(14);
    expect(crossover.length).toBe(1);
  });

  it('should have unique saga IDs', () => {
    const ids = SAGAS.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(SAGAS.length);
  });

  it('should have complete bilingual metadata and valid URLs for all sagas', () => {
    for (const saga of SAGAS) {
      expect(saga.id).toBeTruthy();
      expect(saga.name.en).toBeTruthy();
      expect(saga.name.es).toBeTruthy();
      expect(saga.description.en).toBeTruthy();
      expect(saga.description.es).toBeTruthy();
      expect(saga.poster.startsWith('https://')).toBe(true);
      expect(saga.background.startsWith('https://')).toBe(true);
      expect(saga.genres.length).toBeGreaterThan(0);
      expect(saga.episodes.length).toBeGreaterThan(0);
    }
  });

  it('should not have duplicate episodes within any saga', () => {
    for (const saga of SAGAS) {
      const epSet = new Set<string>();
      for (const ep of saga.episodes) {
        const key = `${ep.imdbId ?? saga.defaultImdbId}:${ep.season}:${ep.episode}`;
        expect(epSet.has(key), `Duplicate episode ${key} found in saga ${saga.id}`).toBe(false);
        epSet.add(key);
      }
    }
  });

  it('should have valid season and episode numbers (> 0)', () => {
    for (const saga of SAGAS) {
      for (const ep of saga.episodes) {
        expect(ep.season).toBeGreaterThan(0);
        expect(ep.episode).toBeGreaterThan(0);
        expect(ep.title.en).toBeTruthy();
        expect(ep.title.es).toBeTruthy();
      }
    }
  });

  it('should include the corrected canonical IMDb episodes from the audit', () => {
    const philHartman = SAGAS_BY_ID.get('simpsons-phil-hartman')!;
    const burns = SAGAS_BY_ID.get('simpsons-burns-files')!;
    const romance = SAGAS_BY_ID.get('futurama-space-romance')!;

    // Sweet Seymour Skinner's Baadasssss Song is S05E19
    const skinnerEp = philHartman.episodes.find((e) => e.title.en.includes('Sweet Seymour'));
    expect(skinnerEp?.season).toBe(5);
    expect(skinnerEp?.episode).toBe(19);

    // Monty Can't Buy Me Love is S10E21
    const montyEp = burns.episodes.find((e) => e.title.en.includes('Monty Can’t Buy Me Love'));
    expect(montyEp?.season).toBe(10);
    expect(montyEp?.episode).toBe(21);

    // Why Must I Be a Crustacean in Love? is S02E09 in Cinemeta / IMDb broadcast order
    const crustaceanEp = romance.episodes.find((e) => e.title.en.includes('Crustacean'));
    expect(crustaceanEp?.season).toBe(2);
    expect(crustaceanEp?.episode).toBe(9);
  });
});

describe('Configuration & Parser Resilience', () => {
  it('should decode empty or default string to full English catalog', () => {
    const fromEmpty = decodeConfig('');
    expect(fromEmpty.lang).toBe('en');
    expect(fromEmpty.sagas.length).toBe(31);

    const fromDefault = decodeConfig('default');
    expect(fromDefault.lang).toBe('en');
    expect(fromDefault.sagas.length).toBe(31);
  });

  it('should cleanly parse config containing version field v for cache-busting', () => {
    const rawObj = {
      lang: 'es',
      sagas: ['simpsons-bob-saga'],
      v: ADDON_VERSION,
    };
    const b64 = toBase64Url(rawObj);
    const decoded = decodeConfig(b64);

    expect(decoded.lang).toBe('es');
    expect(decoded.sagas).toEqual(['simpsons-bob-saga']);
  });

  it('should deduplicate saga IDs in user configuration', () => {
    const rawObj = {
      lang: 'en',
      sagas: ['simpsons-bob-saga', 'simpsons-bob-saga', 'simpsons-bob-saga', 'futurama-tearjerkers'],
    };
    const b64 = toBase64Url(rawObj);
    const decoded = decodeConfig(b64);

    expect(decoded.sagas).toEqual(['simpsons-bob-saga', 'futurama-tearjerkers']);
  });

  it('should filter out non-existent saga IDs and prototype pollution keys', () => {
    const rawObj = {
      lang: 'es',
      sagas: ['simpsons-bob-saga', 'constructor', '__proto__', 'invalid-id-xyz'],
    };
    const b64 = toBase64Url(rawObj);
    const decoded = decodeConfig(b64);

    expect(decoded.lang).toBe('es');
    expect(decoded.sagas).toEqual(['simpsons-bob-saga']);
  });

  it('should fallback to all sagas if the provided list has 0 valid sagas', () => {
    const rawObj = {
      lang: 'en',
      sagas: ['invalid-1', 'invalid-2'],
    };
    const b64 = toBase64Url(rawObj);
    const decoded = decodeConfig(b64);

    expect(decoded.sagas.length).toBe(31);
  });

  it('should gracefully handle malformed base64', () => {
    const decoded = decodeConfig('!!!not-valid-base64???');
    expect(decoded.lang).toBe('en');
    expect(decoded.sagas.length).toBe(31);
  });

  it('should handle malformed percent-encoding in paths without throwing', () => {
    expect(() => safeDecodePath('/%E0%A4%A')).not.toThrow();
  });
});

describe('Worker HTTP Router & Stremio Protocol', () => {
  it('should answer OPTIONS requests with 204 and CORS headers', async () => {
    const req = new Request('https://springfield-3000.workers.dev/manifest.json', {
      method: 'OPTIONS',
    });
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('should reject non-GET/HEAD methods with 405 Method Not Allowed', async () => {
    const req = new Request('https://springfield-3000.workers.dev/manifest.json', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(405);
  });

  it('should serve a valid manifest with series and movie catalogs and stremioAddonsConfig', async () => {
    const req = new Request('https://springfield-3000.workers.dev/manifest.json');
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.id).toBe('org.springfield3000.curated.addon');
    expect(json.version).toBe(ADDON_VERSION);
    expect(json.types).toEqual(['series', 'movie']);
    expect(json.catalogs.length).toBe(2);
    expect(json.catalogs[0].id).toBe('springfield3000-sagas');
    expect(json.catalogs[0].type).toBe('series');
    expect(json.catalogs[1].id).toBe('springfield3000-movies');
    expect(json.catalogs[1].type).toBe('movie');
    expect(json.stremioAddonsConfig.issuer).toBe('https://stremio-addons.net');
    expect(json.stremioAddonsConfig.signature).toBeTruthy();
  });

  it('should return catalog metas for springfield3000-sagas and springfield3000-all with dedicated poster endpoints', async () => {
    const req = new Request(
      'https://springfield-3000.workers.dev/catalog/series/springfield3000-sagas.json'
    );
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.metas.length).toBe(31);
    expect(json.metas[0].poster).toContain('/poster/en/simpsons-bob-saga.jpg');
    expect(json.metas[0].background).toBeTruthy();
    expect(json.metas[0].posterShape).toBe('poster');
    expect(json.metas[1].poster).toContain('/poster/en/simpsons-burns-files.jpg');

    // Backward compatibility for legacy springfield3000-all catalog ID
    const legacyReq = new Request(
      'https://springfield-3000.workers.dev/catalog/series/springfield3000-all.json'
    );
    const legacyRes = await worker.fetch(legacyReq, {});
    expect(legacyRes.status).toBe(200);
  });

  it('should serve direct localized poster endpoint with CORS and return 404 for unknown IDs', async () => {
    const validReqEn = new Request(
      'https://springfield-3000.workers.dev/poster/en/simpsons-bob-saga.jpg'
    );
    const validResEn = await worker.fetch(validReqEn, {});
    expect([200, 302, 502]).toContain(validResEn.status);
    expect(validResEn.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const validReqEs = new Request(
      'https://springfield-3000.workers.dev/poster/es/simpsons-bob-saga.jpg'
    );
    const validResEs = await worker.fetch(validReqEs, {});
    expect([200, 302, 502]).toContain(validResEs.status);
    expect(validResEs.headers.get('Access-Control-Allow-Origin')).toBe('*');

    const invalidReq = new Request(
      'https://springfield-3000.workers.dev/poster/es/non-existent-saga.jpg'
    );
    const invalidRes = await worker.fetch(invalidReq, {});
    expect(invalidRes.status).toBe(404);
  });

  it('should prioritize Cloudflare Workers Static Assets binding when available', async () => {
    const mockAssets = {
      fetch: async (req: Request) => {
        const url = new URL(req.url);
        if (url.pathname === '/posters/es/simpsons-bob-saga.jpg') {
          return new Response('mock-jpg-data', {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          });
        }
        return new Response('Asset Not Found', { status: 404 });
      },
    };

    const req = new Request('https://springfield-3000.workers.dev/poster/es/simpsons-bob-saga.jpg');
    const res = await worker.fetch(req, { ASSETS: mockAssets as any });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    const text = await res.text();
    expect(text).toBe('mock-jpg-data');
  });

  it('should include version cache-busting query parameter in /configure', async () => {
    const req = new Request('https://springfield-3000.workers.dev/configure');
    const res = await worker.fetch(req, {});
    const html = await res.text();
    expect(html).toContain('CURRENT_VERSION = "' + ADDON_VERSION + '"');
    expect(html).toContain('v' + ADDON_VERSION);
  });

  it('should support catalog extras with dots (e.g. search query or skip)', async () => {
    const req = new Request(
      'https://springfield-3000.workers.dev/catalog/series/springfield3000-all/skip=10.json'
    );
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.metas.length).toBe(31);
  });

  it('should return 404 for unknown catalog IDs', async () => {
    const req = new Request(
      'https://springfield-3000.workers.dev/catalog/series/unknown-catalog-123.json'
    );
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(404);
  });

  it('should return meta details with correlative episodes and canonical IDs', async () => {
    const req = new Request(
      'https://springfield-3000.workers.dev/meta/series/simpsons-bob-saga.json'
    );
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(200);

    const json = (await res.json()) as any;
    expect(json.meta.id).toBe('simpsons-bob-saga');
    expect(json.meta.videos.length).toBe(14);
    expect(json.meta.videos[0].id).toBe('tt0096697:1:12');
    expect(json.meta.videos[0].season).toBe(1);
    expect(json.meta.videos[0].episode).toBe(1);
  });

  it('should return 404 for removed series saga futurama-four-epics as it has moved to movies', async () => {
    const req = new Request(
      'https://springfield-3000.workers.dev/meta/series/futurama-four-epics.json'
    );
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(404);
  });

  it('should return movie catalog metas and individual movie meta detail', async () => {
    // 1. Movie catalog route
    const catReq = new Request(
      'https://springfield-3000.workers.dev/catalog/movie/springfield3000-movies.json'
    );
    const catRes = await worker.fetch(catReq, {});
    expect(catRes.status).toBe(200);

    const catJson = (await catRes.json()) as any;
    expect(catJson.metas.length).toBe(5);
    expect(catJson.metas[0].id).toBe('tt0471711');
    expect(catJson.metas[0].type).toBe('movie');
    expect(catJson.metas[4].id).toBe('tt0462538');

    // 2. Movie meta detail route (Bender's Big Score)
    const metaReq = new Request(
      'https://springfield-3000.workers.dev/meta/movie/tt0471711.json'
    );
    const metaRes = await worker.fetch(metaReq, {});
    expect(metaRes.status).toBe(200);

    const metaJson = (await metaRes.json()) as any;
    expect(metaJson.meta.id).toBe('tt0471711');
    expect(metaJson.meta.type).toBe('movie');
    expect(metaJson.meta.name).toBe("Futurama: Bender's Big Score");
    expect(metaJson.meta.videos).toBeUndefined();

    // 3. Movie meta 404 for unknown movie ID
    const notFoundReq = new Request(
      'https://springfield-3000.workers.dev/meta/movie/tt99999999.json'
    );
    const notFoundRes = await worker.fetch(notFoundReq, {});
    expect(notFoundRes.status).toBe(404);
  });

  it('should return 404 for prototype pollution keys like constructor or __proto__', async () => {
    const req1 = new Request(
      'https://springfield-3000.workers.dev/meta/series/constructor.json'
    );
    const res1 = await worker.fetch(req1, {});
    expect(res1.status).toBe(404);

    const req2 = new Request(
      'https://springfield-3000.workers.dev/meta/series/__proto__.json'
    );
    const res2 = await worker.fetch(req2, {});
    expect(res2.status).toBe(404);
  });

  it('should serve /configure with strict CSP and no external cdn.tailwindcss.com script', async () => {
    const req = new Request('https://springfield-3000.workers.dev/configure');
    const res = await worker.fetch(req, {});
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).not.toContain('cdn.tailwindcss.com');
    const csp = res.headers.get('Content-Security-Policy') || '';
    expect(csp).toContain("base-uri 'none'");
    expect(csp).toContain("form-action 'none'");
    expect(csp).toContain("img-src 'self' data:");
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('should set optimal Cache-Control headers across endpoints', async () => {
    const manifestRes = await worker.fetch(
      new Request('https://springfield-3000.workers.dev/manifest.json'),
      {}
    );
    expect(manifestRes.headers.get('Cache-Control')).toContain('no-store');

    const metaRes = await worker.fetch(
      new Request('https://springfield-3000.workers.dev/meta/series/simpsons-bob-saga.json'),
      {}
    );
    expect(metaRes.headers.get('Cache-Control')).toContain('max-age=21600');

    const configRes = await worker.fetch(
      new Request('https://springfield-3000.workers.dev/configure'),
      {}
    );
    expect(configRes.headers.get('Cache-Control')).toContain('no-store');
  });

  it('should utilize edge cache with versioned key', async () => {
    const cachedBody = JSON.stringify({ cached: true });
    const mockCache = {
      match: async (req: Request) => {
        const url = new URL(req.url);
        if (url.searchParams.get('addon_ver') === ADDON_VERSION) {
          return new Response(cachedBody, { status: 200 });
        }
        return undefined;
      },
      put: async () => {},
    };

    // Inject global caches mock with safe try/finally cleanup
    (globalThis as any).caches = { default: mockCache };
    try {
      const req = new Request('https://springfield-3000.workers.dev/manifest.json');
      const res = await worker.fetch(req, {});
      const text = await res.text();
      expect(text).toBe(cachedBody);
    } finally {
      delete (globalThis as any).caches;
    }
  });
});

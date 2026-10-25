const { SAGAS } = require('../dist/data/sagas.js');
const { MOVIES } = require('../dist/data/movies.js');

const CINEMETA_URL = 'https://v3-cinemeta.strem.io/meta';

// Regex for recognized standalone Roman numerals (longest to shortest)
const ROMAN_REGEX = /\b(xxxvii|xxxvi|xxxv|xxxiv|xxxiii|xxxii|xxxi|xxx|xxix|xxviii|xxvii|xxvi|xxv|xxiv|xxiii|xxii|xxi|xx|xix|xviii|xvii|xvi|xv|xiv|xiii|xii|xi|x|ix|viii|vii|vi|v|iv|iii|ii|i)\b/g;

function extractRomans(str) {
  const matches = str.match(ROMAN_REGEX);
  return matches ? matches : [];
}

function extractNumbers(str) {
  const matches = str.match(/\b\d+\b/g);
  return matches ? matches : [];
}

function norm(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(/['’"`]/g, '')
    .replace(/klown/g, 'clown')
    .replace(/homediddily/g, 'homediddly')
    .replace(/cancelled/g, 'canceled')
    .replace(/\bpart\s+(?:one|1)\b/g, '1')
    .replace(/\bpart\s+(?:two|2)\b/g, '2')
    .replace(/\b(?:volumes?|vol\.?)\s*(?:i\s*and\s*ii|1\s*and\s*2|i\s*&\s*ii|1\s*&\s*2)\b/g, '1 and 2')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titlesMatch(expected, actual) {
  const nExp = norm(expected);
  const nAct = norm(actual);
  if (!nExp || !nAct) return false;
  if (nExp === nAct) return true;

  // 1. Strict Roman numeral check:
  // If either title has Roman numerals, they must match exactly.
  // Exception: "Treehouse of Horror I" vs "Treehouse of Horror" (Cinemeta omits 'I' on the original pilot special)
  const expRomans = extractRomans(nExp);
  const actRomans = extractRomans(nAct);

  const isThohPilot =
    (nExp.startsWith('treehouse of horror') && nAct.startsWith('treehouse of horror')) &&
    ((expRomans.length === 1 && expRomans[0] === 'i' && actRomans.length === 0) ||
     (actRomans.length === 1 && actRomans[0] === 'i' && expRomans.length === 0));

  if (!isThohPilot) {
    if (expRomans.length > 0 || actRomans.length > 0) {
      if (expRomans.join(' ') !== actRomans.join(' ')) {
        return false;
      }
    }
  }

  // 2. Strict Arabic numbers check:
  // If both titles have numbers (e.g. "Part 1" vs "Part 2" or "2.0"), they must match exactly.
  const expNums = extractNumbers(nExp);
  const actNums = extractNumbers(nAct);
  if (expNums.length > 0 && actNums.length > 0) {
    if (expNums.join(' ') !== actNums.join(' ')) {
      return false;
    }
  }

  // 3. Substring matching allowed only when numbers/romans are not conflicting
  if (nExp.includes(nAct) || nAct.includes(nExp)) {
    return true;
  }

  return false;
}

async function fetchJson(url, retries = 2, timeoutMs = 15000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Springfield3000-Validator/1.0' },
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} from ${url}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ⚠️ Retry ${attempt}/${retries} for ${url} (${err.message})`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function validateCinemeta() {
  console.log(`🔍 Starting Cinemeta validation for ${SAGAS.length} sagas and ${MOVIES.length} movies...\n`);
  let errors = 0;
  let warnings = 0;

  // 1. Validate Feature Films
  console.log(`🎬 1. Validating ${MOVIES.length} Feature Films...`);
  for (const movie of MOVIES) {
    try {
      const data = await fetchJson(`${CINEMETA_URL}/movie/${movie.id}.json`);
      if (!data.meta || data.meta.id !== movie.id) {
        console.error(`  ❌ Movie ${movie.id} (${movie.name.en}): ID mismatch in Cinemeta.`);
        errors++;
        continue;
      }

      const cName = data.meta.name || '';
      const cYear = String(data.meta.year || '');
      const expYear = String(movie.releaseInfo || '');

      if (!titlesMatch(movie.name.en, cName)) {
        console.error(`  ❌ Movie ${movie.id} title mismatch! Expected: "${movie.name.en}", Cinemeta: "${cName}"`);
        errors++;
      } else if (expYear && cYear && expYear !== cYear) {
        console.warn(`  ⚠️ Movie ${movie.id} year difference: expected ${expYear}, Cinemeta has ${cYear}`);
        warnings++;
      } else {
        console.log(`  ✅ ${movie.id} -> Cinemeta: "${cName}" (${cYear || expYear})`);
      }
    } catch (err) {
      console.error(`  ❌ Failed to fetch movie ${movie.id}: ${err.message}`);
      errors++;
    }
  }

  // 2. Fetch Cinemeta Video Indexes for The Simpsons and Futurama
  console.log('\n📺 2. Fetching Cinemeta Series Index...');
  const cinemetaEpisodes = new Map();

  const seriesIds = [
    { name: 'The Simpsons', imdb: 'tt0096697' },
    { name: 'Futurama', imdb: 'tt0149460' },
  ];

  for (const series of seriesIds) {
    try {
      console.log(`  Fetching Cinemeta catalog for ${series.name} (${series.imdb})...`);
      const data = await fetchJson(`${CINEMETA_URL}/series/${series.imdb}.json`);
      const videos = data.meta?.videos || [];
      console.log(`  Loaded ${videos.length} episodes for ${series.name}.`);

      for (const v of videos) {
        const key = `${series.imdb}:${v.season}:${v.number || v.episode}`;
        cinemetaEpisodes.set(key, v);
      }
    } catch (err) {
      console.error(`  ❌ Failed to fetch series catalog for ${series.name}: ${err.message}`);
      errors++;
    }
  }

  // 3. Validate Every Episode Across All Sagas
  console.log(`\n🍩 3. Validating Episode References Across ${SAGAS.length} Sagas...`);
  let totalEpisodesChecked = 0;
  let titleMatches = 0;

  for (const saga of SAGAS) {
    let sagaMatches = 0;
    let sagaErrors = 0;

    for (const ep of saga.episodes) {
      totalEpisodesChecked++;
      const showId = ep.imdbId || saga.defaultImdbId;
      const key = `${showId}:${ep.season}:${ep.episode}`;
      const cinemetaEp = cinemetaEpisodes.get(key);

      if (!cinemetaEp) {
        console.error(`  ❌ [${saga.id}] Episode missing in Cinemeta: S${ep.season}E${ep.episode} ("${ep.title.en}") -> Key: ${key}`);
        errors++;
        sagaErrors++;
        continue;
      }

      const cTitle = cinemetaEp.name || cinemetaEp.title || '';
      if (!titlesMatch(ep.title.en, cTitle)) {
        console.error(`  ❌ [${saga.id}] Title mismatch at S${ep.season}E${ep.episode}!`);
        console.error(`     Expected : "${ep.title.en}"`);
        console.error(`     Cinemeta : "${cTitle}" (Key: ${key})`);
        errors++;
        sagaErrors++;
      } else {
        titleMatches++;
        sagaMatches++;
      }
    }

    if (sagaErrors === 0) {
      const universeBadge = saga.universe.toUpperCase().padEnd(9);
      console.log(`  ✅ [${universeBadge}] ${saga.id.padEnd(30)}: ${sagaMatches}/${saga.episodes.length} episodes verified`);
    } else {
      console.error(`  ❌ [${saga.universe.toUpperCase()}] ${saga.id}: ${sagaErrors} error(s) found!`);
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Summary:`);
  console.log(`- Checked ${MOVIES.length} movies.`);
  console.log(`- Checked ${totalEpisodesChecked} episode references across ${SAGAS.length} sagas.`);
  console.log(`- Title matches verified: ${titleMatches}/${totalEpisodesChecked}`);
  console.log(`- Errors: ${errors}`);
  console.log(`- Warnings: ${warnings}`);
  console.log(`========================================\n`);

  if (errors > 0) {
    console.error(`❌ Cinemeta validation failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`✅ All ${MOVIES.length} movies and ${totalEpisodesChecked} episode references across ${SAGAS.length} sagas passed strict canonical title & ID verification! 🎉`);
  }
}

validateCinemeta().catch((err) => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});

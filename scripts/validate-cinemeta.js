const { SAGAS } = require('../dist/data/sagas.js');
const { MOVIES } = require('../dist/data/movies.js');

const CINEMETA_URL = 'https://v3-cinemeta.strem.io/meta';

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Springfield3000-Validator/1.0' },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}`);
  }
  return res.json();
}

async function validateCinemeta() {
  console.log('🔍 Starting Cinemeta validation for Springfield 3000...\n');
  let errors = 0;
  let warnings = 0;

  // 1. Validate Feature Films
  console.log('🎬 1. Validating 5 Feature Films...');
  for (const movie of MOVIES) {
    try {
      const data = await fetchJson(`${CINEMETA_URL}/movie/${movie.id}.json`);
      if (!data.meta || data.meta.id !== movie.id) {
        console.error(`❌ Movie ${movie.id} (${movie.name.en}): ID mismatch in Cinemeta.`);
        errors++;
      } else {
        console.log(`  ✅ ${movie.id} -> Cinemeta: "${data.meta.name}" (Year: ${data.meta.year})`);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch movie ${movie.id}: ${err.message}`);
      errors++;
    }
  }

  // 2. Fetch Cinemeta Video Indexes for The Simpsons and Futurama
  console.log('\n📺 2. Fetching Cinemeta Series Index...');
  const cinemetaEpisodes = new Map(); // key: `${imdbId}:${season}:${episode}` -> Cinemeta Video Object

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
      console.error(`❌ Failed to fetch series catalog for ${series.name}: ${err.message}`);
      errors++;
    }
  }

  // 3. Validate Every Episode Across All 31 Sagas
  console.log('\n🍩 3. Validating Saga Episodes against Cinemeta Index...');
  let totalEpisodesChecked = 0;
  const missingEpisodes = [];

  for (const saga of SAGAS) {
    for (const ep of saga.episodes) {
      totalEpisodesChecked++;
      const showId = ep.imdbId || saga.defaultImdbId;
      const key = `${showId}:${ep.season}:${ep.episode}`;
      const cinemetaEp = cinemetaEpisodes.get(key);

      if (!cinemetaEp) {
        missingEpisodes.push({ sagaId: saga.id, key, title: ep.title.en });
        console.error(`  ❌ [${saga.id}] Episode missing in Cinemeta: S${ep.season}E${ep.episode} ("${ep.title.en}") -> Key: ${key}`);
        errors++;
      }
    }
  }

  console.log(`\n========================================`);
  console.log(`📊 Summary:`);
  console.log(`- Checked ${MOVIES.length} movies: all queried.`);
  console.log(`- Checked ${totalEpisodesChecked} episode references across 31 sagas.`);
  console.log(`- Errors: ${errors}`);
  console.log(`- Warnings: ${warnings}`);
  console.log(`========================================\n`);

  if (errors > 0) {
    console.error(`❌ Cinemeta validation failed with ${errors} error(s).`);
    process.exit(1);
  } else {
    console.log(`✅ ALL MOVIES AND SAGA EPISODES ARE 100% CANONICALLY VALIDATED IN CINEMETA! 🎉`);
  }
}

validateCinemeta().catch((err) => {
  console.error('Fatal error during validation:', err);
  process.exit(1);
});

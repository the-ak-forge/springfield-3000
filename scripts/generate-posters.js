const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { SAGAS } = require('../dist/data/sagas.js');

const WIDTH = 600;
const HEIGHT = 900;
const STILL_HEIGHT = 580;

function escXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTitle(title) {
  const clean = title.replace(/^\d+\.\s*/, '').trim();
  const words = clean.split(' ');
  const lines = [];
  let cur = '';

  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= 22) {
      cur = (cur + ' ' + w).trim();
    } else {
      if (cur) lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function getFranchiseBadge(universe, lang) {
  if (universe === 'simpsons') {
    return {
      text: lang === 'es' ? 'LOS SIMPSON' : 'THE SIMPSONS',
      bg: '#FACC15',
      textColor: '#020617',
      accent: '#FACC15',
      width: lang === 'es' ? 140 : 160,
    };
  } else if (universe === 'futurama') {
    return {
      text: 'FUTURAMA',
      bg: '#EF4444',
      textColor: '#FFFFFF',
      accent: '#38BDF8',
      width: 130,
    };
  } else {
    return {
      text: lang === 'es' ? 'CROSSOVER' : 'CROSSOVER',
      bg: '#8B5CF6',
      textColor: '#FFFFFF',
      accent: '#C084FC',
      width: 140,
    };
  }
}

async function fetchImageBuffer(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url} (status: ${res.status})`);
  }
  return Buffer.from(await res.arrayBuffer());
}

async function renderPoster(saga, index, lang, stillResized) {
  const badge = getFranchiseBadge(saga.universe, lang);
  const rawTitle = saga.name[lang];
  const lines = wrapTitle(rawTitle);

  const numPadded = String(index + 1).padStart(2, '0');
  const collectionLabel =
    saga.universe === 'crossover'
      ? lang === 'es' ? 'EVENTO ESPECIAL' : 'SPECIAL EVENT'
      : lang === 'es' ? `COLECCIÓN ${numPadded}` : `COLLECTION ${numPadded}`;

  const epCount = saga.episodes.length;
  const epLabel = lang === 'es' ? `${epCount} EPISODIOS` : `${epCount} EPISODES`;

  // Dynamic vertical layout based on number of lines
  let labelY = 675;
  let textSvg = '';

  if (lines.length === 1) {
    labelY = 690;
    textSvg = `<text x="40" y="750" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="36" font-weight="900" fill="${badge.accent}">${escXml(lines[0])}</text>`;
  } else if (lines.length === 2) {
    labelY = 665;
    textSvg = `
      <text x="40" y="725" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="34" font-weight="900" fill="#FFFFFF">${escXml(lines[0])}</text>
      <text x="40" y="770" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="34" font-weight="900" fill="${badge.accent}">${escXml(lines[1])}</text>
    `;
  } else {
    labelY = 645;
    textSvg = `
      <text x="40" y="695" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF">${escXml(lines[0])}</text>
      <text x="40" y="735" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="28" font-weight="900" fill="#FFFFFF">${escXml(lines[1])}</text>
      <text x="40" y="775" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="28" font-weight="900" fill="${badge.accent}">${escXml(lines[2])}</text>
    `;
  }

  const svgOverlay = `
  <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gradTop" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="gradBottom" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#020617" stop-opacity="0"/>
        <stop offset="35%" stop-color="#020617" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#020617" stop-opacity="0.98"/>
      </linearGradient>
    </defs>

    <!-- Top dark fade -->
    <rect x="0" y="0" width="${WIDTH}" height="180" fill="url(#gradTop)"/>

    <!-- Bottom gradient blend -->
    <rect x="0" y="360" width="${WIDTH}" height="540" fill="url(#gradBottom)"/>

    <!-- Franchise Badge -->
    <g transform="translate(40, 50)">
      <rect x="0" y="0" width="${badge.width}" height="28" rx="6" fill="${badge.bg}"/>
      <text x="${badge.width / 2}" y="19" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="13" font-weight="900" fill="${badge.textColor}" text-anchor="middle" letter-spacing="1.5">${escXml(badge.text)}</text>
    </g>

    <!-- Collection Label -->
    <text x="40" y="${labelY}" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="14" font-weight="700" fill="#94A3B8" letter-spacing="3">${escXml(collectionLabel)}</text>

    <!-- Title Lines -->
    ${textSvg}

    <!-- Episode counter & footer tag -->
    <g transform="translate(40, 825)">
      <rect x="0" y="0" width="120" height="26" rx="13" fill="#1E293B"/>
      <text x="60" y="17" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="700" fill="#38BDF8" text-anchor="middle">${escXml(epLabel)}</text>
      <text x="140" y="17" font-family="-apple-system, BlinkMacSystemFont, Arial, sans-serif" font-size="12" font-weight="600" fill="#64748B">SPRINGFIELD 3000</text>
    </g>
  </svg>`;

  return await sharp({
    create: {
      width: WIDTH,
      height: HEIGHT,
      channels: 4,
      background: { r: 2, g: 6, b: 23, alpha: 1 },
    },
  })
    .composite([
      { input: stillResized, top: 0, left: 0 },
      { input: Buffer.from(svgOverlay), top: 0, left: 0 },
    ])
    .jpeg({ quality: 88 })
    .toBuffer();
}

async function main() {
  const assetsDir = path.resolve(__dirname, '../assets/posters');
  const esDir = path.join(assetsDir, 'es');
  const enDir = path.join(assetsDir, 'en');

  fs.mkdirSync(esDir, { recursive: true });
  fs.mkdirSync(enDir, { recursive: true });

  const totalPosters = SAGAS.length * 2;
  console.log(`🚀 Generating posters for ${SAGAS.length} sagas in 2 languages (${totalPosters} posters total)...`);

  let errorCount = 0;
  for (let i = 0; i < SAGAS.length; i++) {
    const saga = SAGAS[i];
    console.log(`[${i + 1}/${SAGAS.length}] Processing ${saga.id}...`);

    try {
      const imgBuf = await fetchImageBuffer(saga.poster);
      const stillResized = await sharp(imgBuf)
        .resize(WIDTH, STILL_HEIGHT, { fit: 'cover', position: 'center' })
        .toBuffer();

      // Spanish poster
      const esPoster = await renderPoster(saga, i, 'es', stillResized);
      fs.writeFileSync(path.join(esDir, `${saga.id}.jpg`), esPoster);

      // English poster
      const enPoster = await renderPoster(saga, i, 'en', stillResized);
      fs.writeFileSync(path.join(enDir, `${saga.id}.jpg`), enPoster);
    } catch (err) {
      errorCount++;
      console.error(`❌ Error generating poster for ${saga.id}:`, err.message);
    }
  }

  if (errorCount > 0) {
    console.error(`❌ Poster generation failed with ${errorCount} error(s).`);
    process.exit(1);
  }

  console.log(`✅ All ${totalPosters} posters generated successfully in assets/posters/`);
}

main().catch((err) => {
  console.error('Fatal poster build error:', err);
  process.exit(1);
});

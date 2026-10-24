# 🍩 Springfield 3000 🚀

[![Stremio Addon Protocol v1](https://img.shields.io/badge/Stremio%20Addon-Protocol%20v1-7A58EC.svg)](https://stremio.com)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020.svg?logo=cloudflare)](https://workers.cloudflare.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![Bilingual](https://img.shields.io/badge/Language-EN%20%7C%20ES-success.svg)](#features)

**Springfield 3000** is a serverless Stremio curation addon deployed on Cloudflare Workers. It transforms the vast catalogs of ***The Simpsons*** (`tt0096697`) and ***Futurama*** (`tt0149460`) into 32 structured thematic collections, chronological character arcs, and complete anthologies (updated through October 2026).

---

## 🌟 Features

* **32 Curated Sagas:**
  * **16 The Simpsons Sagas:** Sideshow Bob Vendetta, Mr. Burns Dossier, Phil Hartman Tribute, Krusty Saga, Ned Flanders' Faith, Flashbacks, Future Visions, Mona Simpson, Meta-Fiction, Prestige Parodies, Itchy & Scratchy, Treehouse of Horror (I–XXXVII), Christmas Specials, World Travel, Homer's Jobs, and Lisa's Rebellion.
  * **15 Futurama Sagas:** Fry & Leela Romance, The Nibblonians, Leela's Mutant Origin, Time Travel & Paradoxes, Prof. Farnsworth's Hubris, Tearjerkers, What-If Vault, Robot Santa Xmas Terror, Hulu Renaissance (2023–2026), Bender's Destiny, Zapp Brannigan DOOP Dossier, Dr. Zoidberg, Robot Underworld, Corporate Warfare (Mom vs. Planet Express), and The Four Epics (The Feature Movies).
  * **1 Official Crossover:** *Simpsorama* (The Simpsons S26E06).
* **Individual Vertical Posters:** Each collection features bespoke 2:3 vertical typography posters (`600x900`), self-hosted directly via Cloudflare Workers Static Assets at `/poster/:lang/:sagaId.jpg` with edge-caching and CORS.
* **Canonical Cinemeta & IMDb Stream Delegation:** Video IDs resolve to canonical IMDb/Cinemeta identifiers (`tt0096697:season:episode` and `tt0149460:season:episode`), ensuring scrapers (Torrentio, Debridio, etc.) automatically stream the exact correct episode.
* **Bilingual Support (EN / ES):** Full English and Spanish localization for saga titles, episode names, and overviews.
* **Interactive Web Configurator (`/configure`):** Clean, zero-dependency responsive dark interface where users can select their preferred sagas and language in one click.
* **Serverless & Ultra-Fast:** Built with native Web Standards (`Request`, `Response`, `URL`) running edge-cached on Cloudflare Workers with zero heavy dependencies.

---

## 🚀 Live Demo & Installation

* **Web Configurator:** [https://springfield-3000.ak-forge.workers.dev/configure](https://springfield-3000.ak-forge.workers.dev/configure)
* **Default Manifest (English):** [https://springfield-3000.ak-forge.workers.dev/manifest.json](https://springfield-3000.ak-forge.workers.dev/manifest.json)
* **One-Click Stremio Install:** `stremio://springfield-3000.ak-forge.workers.dev/manifest.json`

---

## 🛠️ Local Development

### Prerequisites
* [Node.js](https://nodejs.org) (v22.12+)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Setup
```bash
# Clone the repository
git clone https://github.com/the-ak-forge/springfield-3000.git
cd springfield-3000

# Install development dependencies
npm install

# Run local development server
npm run dev
```

Visit `http://localhost:8787/configure` in your browser.

### Typecheck, Tests & Build Posters
```bash
# Verify TypeScript types
npm run typecheck

# Run Vitest test suite
npm test

# Regenerate bespoke 2:3 posters
npm run posters:build

# Deploy to Cloudflare Workers
npm run deploy
```

---

## 📂 Project Structure

```text
springfield3000/
├── assets/
│   └── posters/            # 64 curated 2:3 vertical posters (32 EN + 32 ES)
├── scripts/
│   └── generate-posters.js # Automated typography poster composition engine
├── src/
│   ├── data/
│   │   └── sagas.ts        # In-memory dataset of 32 sagas with canonical Cinemeta metadata
│   ├── views/
│   │   └── configure.ts    # Responsive dark configurator UI
│   ├── types.ts            # Stremio Addon Protocol v1 TypeScript definitions
│   └── index.ts            # Cloudflare Worker router & Stremio endpoints
├── tests/
│   └── addon.test.ts       # 26 automated unit and integration tests
├── package.json
├── tsconfig.json
├── wrangler.toml
└── README.md
```

---

## 📜 Disclaimer & License

**Disclaimer:** *Springfield 3000* is an unofficial, open-source community curation addon for Stremio. It organizes public episode identifiers and metadata for editorial and organizational purposes. All series trademarks, characters, artwork, and associated intellectual property remain the property of their respective copyright holders (The Walt Disney Company, 20th Television, and The Curiosity Company). This addon does not store, host, or transmit video or audio files; all stream playback requests are resolved by independent, user-installed scrapers.

The addon codebase is licensed under the **MIT License**.

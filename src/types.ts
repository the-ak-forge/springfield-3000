export type Language = 'en' | 'es';

export type Universe = 'simpsons' | 'futurama' | 'crossover';

export type ShowImdbId = 'tt0096697' | 'tt0149460' | string;

export interface LocalizedText {
  en: string;
  es: string;
}

export interface SagaEpisodeRef {
  /** Override show IMDb ID if different from the saga's primary show (useful for crossovers and movies) */
  imdbId?: ShowImdbId;
  season: number;
  episode: number;
  title: LocalizedText;
  overview?: LocalizedText;
  released?: string;
  isMovie?: boolean;
  thumbnail?: string;
}

export interface SagaDefinition {
  id: string;
  universe: Universe;
  defaultImdbId: ShowImdbId;
  name: LocalizedText;
  description: LocalizedText;
  poster: string;
  background: string;
  genres: string[];
  releaseInfo: string;
  imdbRating: string;
  episodes: SagaEpisodeRef[];
}

export interface MovieDefinition {
  id: string;
  universe: Universe;
  name: LocalizedText;
  description: LocalizedText;
  poster: string;
  background: string;
  genres: string[];
  releaseInfo: string;
  imdbRating: string;
}

export interface UserConfig {
  lang: Language;
  sagas: string[];
  v?: string;
}

/* --- Stremio Addon Protocol v1 Types --- */

export interface StremioCatalogDescriptor {
  type: 'series' | 'movie';
  id: string;
  name: string;
  extra?: Array<{
    name: string;
    isRequired?: boolean;
    options?: string[];
  }>;
}

export interface StremioManifest {
  id: string;
  version: string;
  name: string;
  description: string;
  logo?: string;
  background?: string;
  types: Array<'series' | 'movie'>;
  catalogs: StremioCatalogDescriptor[];
  resources: Array<
    | 'catalog'
    | 'meta'
    | {
        name: 'catalog' | 'meta';
        types: Array<'series' | 'movie'>;
        idPrefixes?: string[];
      }
  >;
  idPrefixes?: string[];
  behaviorHints?: {
    configurable?: boolean;
    configurationRequired?: boolean;
  };
  stremioAddonsConfig?: {
    issuer: string;
    signature: string;
  };
}

export interface StremioMetaPreview {
  id: string;
  type: 'series' | 'movie';
  name: string;
  poster: string;
  posterShape?: 'poster' | 'landscape' | 'square';
  background?: string;
  description: string;
  releaseInfo?: string;
  imdbRating?: string;
  genres?: string[];
}

export interface StremioVideo {
  /** Canonical IMDb ID delegated to stream scrapers: tt0096697:season:episode */
  id: string;
  title: string;
  season: number;
  episode: number;
  released: string;
  overview?: string;
  thumbnail?: string;
}

export interface StremioMetaDetail extends StremioMetaPreview {
  videos?: StremioVideo[];
}

export interface WorkerEnv {
  ASSETS?: {
    fetch: (request: Request | string) => Promise<Response>;
  };
}

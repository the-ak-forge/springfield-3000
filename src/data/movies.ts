import { MovieDefinition } from '../types';

export const MOVIES: MovieDefinition[] = [
  {
    id: 'tt0471711',
    universe: 'futurama',
    name: {
      en: "Futurama: Bender's Big Score",
      es: 'Futurama: El gran golpe de Bender',
    },
    description: {
      en: 'Planet Express is taken over by nude alien scammers who use time travel to loot the past, while Bender is brainwashed into doing their bidding.',
      es: 'Planet Express es tomada por estafadores alienígenas que usan viajes en el tiempo para saquear el pasado, controlando la mente de Bender.',
    },
    poster: 'https://images.metahub.space/poster/medium/tt0471711/img',
    background: 'https://images.metahub.space/background/medium/tt0471711/img',
    genres: ['Animation', 'Adventure', 'Comedy', 'Sci-Fi'],
    releaseInfo: '2007',
    imdbRating: '7.6',
  },
  {
    id: 'tt1054485',
    universe: 'futurama',
    name: {
      en: 'Futurama: The Beast with a Billion Backs',
      es: 'Futurama: La bestia con un millón de espaldas',
    },
    description: {
      en: 'A colossal planet-sized tentacled creature from another dimension enters our universe and begins seducing all living beings on Earth.',
      es: 'Una colosal criatura con tentáculos proveniente de otra dimensión entra a nuestro universo y comienza a seducir a todos los seres vivos de la Tierra.',
    },
    poster: 'https://images.metahub.space/poster/medium/tt1054485/img',
    background: 'https://images.metahub.space/background/medium/tt1054485/img',
    genres: ['Animation', 'Adventure', 'Comedy', 'Sci-Fi'],
    releaseInfo: '2008',
    imdbRating: '7.2',
  },
  {
    id: 'tt1054486',
    universe: 'futurama',
    name: {
      en: "Futurama: Bender's Game",
      es: 'Futurama: El juego de Bender',
    },
    description: {
      en: "Fuel prices skyrocket, leading the crew to Mom's dark-matter mine, where Bender's D&D fantasies suck them into the high-fantasy realm of Cornwood.",
      es: 'El precio del combustible se dispara y lleva a la tripulación a la mina de materia oscura de Mamá, donde la obsesión de Bender por D&D los arrastra a un mundo de fantasía.',
    },
    poster: 'https://images.metahub.space/poster/medium/tt1054486/img',
    background: 'https://images.metahub.space/background/medium/tt1054486/img',
    genres: ['Animation', 'Adventure', 'Comedy', 'Fantasy', 'Sci-Fi'],
    releaseInfo: '2008',
    imdbRating: '7.2',
  },
  {
    id: 'tt1054487',
    universe: 'futurama',
    name: {
      en: 'Futurama: Into the Wild Green Yonder',
      es: 'Futurama: Hacia la verde inmensidad',
    },
    description: {
      en: 'Dark forces older than time threaten the universe, and Fry must join the secret society of the Legion of Madfellows to save eco-feminists and the cosmos.',
      es: 'Fuerzas oscuras más antiguas que el tiempo amenazan el universo, y Fry se une a la sociedad secreta de los Chiflados para salvar a las eco-feministas y el cosmos.',
    },
    poster: 'https://images.metahub.space/poster/medium/tt1054487/img',
    background: 'https://images.metahub.space/background/medium/tt1054487/img',
    genres: ['Animation', 'Adventure', 'Comedy', 'Sci-Fi'],
    releaseInfo: '2009',
    imdbRating: '7.2',
  },
  {
    id: 'tt0462538',
    universe: 'simpsons',
    name: {
      en: 'The Simpsons Movie',
      es: 'Los Simpson: La Película',
    },
    description: {
      en: "After Homer accidentally pollutes the town's water supply, Springfield is encased in a giant glass dome by the EPA, and the Simpsons are declared fugitives.",
      es: 'Después de que Homero contamina accidentalmente el suministro de agua, Springfield es encapsulada en una cúpula gigante por la EPA y los Simpson son declarados fugitivos.',
    },
    poster: 'https://images.metahub.space/poster/medium/tt0462538/img',
    background: 'https://images.metahub.space/background/medium/tt0462538/img',
    genres: ['Animation', 'Adventure', 'Comedy'],
    releaseInfo: '2007',
    imdbRating: '7.3',
  },
];

export const MOVIES_BY_ID = new Map<string, MovieDefinition>(
  MOVIES.map((m) => [m.id, m])
);

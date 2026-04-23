// Conecta con la API de Scryfall para obtener cartas.
// Descarga todo el set una vez y distribuye raridades localmente para evitar rate limits.

const API_URL  = import.meta.env.VITE_API_URL  || 'https://api.scryfall.com';
const SET_CODE = import.meta.env.VITE_SET_CODE || 'blb';

// Composición estándar de un sobre de draft
const PACK_COMPOSITION = {
  COMMONS:   10,
  UNCOMMONS:  4,
  RARES:      1,
  TOKENS:     1,
};

let setCardsCache = null;
let fetchPromise = null;

export const resetCache = () => { 
  setCardsCache = null; 
  fetchPromise = null;
};

// Extrae la imagen correcta considerando cartas de doble cara
export const getCardImage = (card) =>
  card.image_uris?.normal          ||
  card.card_faces?.[0]?.image_uris?.normal ||
  card.image_uris?.large           ||
  card.card_faces?.[0]?.image_uris?.large  ||
  '';

// Selecciona `count` elementos al azar de `arr` sin repetición (Fisher-Yates parcial)
export const getRandom = (arr, count) => {
  const copy   = [...arr];
  const result = [];
  for (let i = 0; i < count; i++) {
    if (copy.length === 0) break;
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
};

export const fetchSetCards = async () => {
  if (setCardsCache) return setCardsCache;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    let allCards = [];
    let nextUrl = `${API_URL}/cards/search?q=set:${SET_CODE}+-type:basic`;

    while (nextUrl) {
      const response = await fetch(nextUrl);
      if (!response.ok) {
        fetchPromise = null;
        throw new Error(`Error al contactar Scryfall: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      allCards = allCards.concat(data.data);
      nextUrl = data.has_more ? data.next_page : null;
      
      // Respetar el rate limit recomendado por Scryfall (50-100ms)
      if (nextUrl) await new Promise(resolve => setTimeout(resolve, 100));
    }

    setCardsCache = allCards;
    return allCards;
  })();
  
  return fetchPromise;
};

export const generateBoosterPack = async () => {
  const cards = await fetchSetCards();

  if (!cards || cards.length === 0) {
    throw new Error('No se pudieron obtener las cartas del set.');
  }

  const pool = {
    common:   cards.filter(c => c.rarity === 'common'),
    uncommon: cards.filter(c => c.rarity === 'uncommon'),
    rare:     cards.filter(c => c.rarity === 'rare' || c.rarity === 'mythic'),
    token:    cards.filter(c => c.type_line?.includes('Token')),
  };

  // Token genérico si el set no tiene tokens en la búsqueda
  if (pool.token.length === 0) {
    pool.token = [{
      id: 'fake-token',
      name: 'Treasure Token',
      rarity: 'token',
      type_line: 'Token Artifact — Treasure',
      image_uris: {
        normal: 'https://cards.scryfall.io/normal/front/1/7/17b20464-9ca9-4806-a212-e877e5d26392.jpg?1682206013',
      },
      prices: { usd: '0.10' },
    }];
  }

  const pack = [
    ...getRandom(pool.common,   PACK_COMPOSITION.COMMONS),
    ...getRandom(pool.uncommon, PACK_COMPOSITION.UNCOMMONS),
    ...getRandom(pool.rare,     PACK_COMPOSITION.RARES),
    // Forzar rarity 'token' para que Inventory los clasifique correctamente
    ...getRandom(pool.token,    PACK_COMPOSITION.TOKENS).map(c => ({ ...c, rarity: 'token' })),
  ];

  if (pack.length === 0) {
    throw new Error('No se pudo generar el sobre: cartas insuficientes en el set.');
  }

  const generateSafeId = () => {
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
      }
    } catch (e) {}
    return Math.random().toString(36).substring(2, 15);
  };

  return pack.sort(() => Math.random() - 0.5).map(c => ({
    id: generateSafeId(),
    name: c.name,
    rarity: c.rarity,
    type_line: c.type_line,
    image: getCardImage(c),
    price: parseFloat(c.prices?.usd || c.prices?.usd_foil || '0.25'),
  }));
};

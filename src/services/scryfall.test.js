import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRandom, getCardImage, generateBoosterPack, fetchSetCards, resetCache } from './scryfall';

// ─── getRandom ────────────────────────────────────────────────────────────────

describe('getRandom', () => {
  it('devuelve la cantidad exacta solicitada', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(getRandom(arr, 3)).toHaveLength(3);
  });

  it('no repite elementos', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = getRandom(arr, 5);
    const unique = new Set(result);
    expect(unique.size).toBe(5);
  });

  it('devuelve todos si count > arr.length', () => {
    const arr = [1, 2, 3];
    expect(getRandom(arr, 10)).toHaveLength(3);
  });

  it('devuelve array vacío si arr está vacío', () => {
    expect(getRandom([], 5)).toEqual([]);
  });

  it('no muta el array original', () => {
    const arr = [1, 2, 3, 4, 5];
    getRandom(arr, 3);
    expect(arr).toHaveLength(5);
  });
});

// ─── getCardImage ─────────────────────────────────────────────────────────────

describe('getCardImage', () => {
  it('devuelve image_uris.normal si existe', () => {
    const card = { image_uris: { normal: 'http://img.com/normal.jpg' } };
    expect(getCardImage(card)).toBe('http://img.com/normal.jpg');
  });

  it('usa card_faces[0] para cartas de doble cara', () => {
    const card = {
      card_faces: [{ image_uris: { normal: 'http://img.com/face0.jpg' } }],
    };
    expect(getCardImage(card)).toBe('http://img.com/face0.jpg');
  });

  it('cae a large si no hay normal', () => {
    const card = { image_uris: { large: 'http://img.com/large.jpg' } };
    expect(getCardImage(card)).toBe('http://img.com/large.jpg');
  });

  it('devuelve string vacío si no hay imágenes', () => {
    expect(getCardImage({})).toBe('');
  });
});

// ─── fetchSetCards / generateBoosterPack ─────────────────────────────────────

const MOCK_CARDS = Array.from({ length: 30 }, (_, i) => ({
  id: `card-${i}`,
  name: `Card ${i}`,
  rarity: i < 20 ? 'common' : i < 26 ? 'uncommon' : 'rare',
  type_line: 'Creature',
  image_uris: { normal: `http://img.com/card${i}.jpg` },
  prices: { usd: '0.50' },
}));

beforeEach(() => {
  // Limpiar caché entre tests para que fetch se llame de nuevo
  resetCache();
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ data: MOCK_CARDS }),
    })
  );
});

describe('generateBoosterPack', () => {
  it('genera el sobre con la cantidad correcta de cartas', async () => {
    const pack = await generateBoosterPack();
    // 10 comunes + 4 infrecuentes + 1 rara + 1 token (fallback) = 16
    expect(pack).toHaveLength(16);
  });

  it('cada carta tiene las propiedades requeridas', async () => {
    const pack = await generateBoosterPack();
    for (const card of pack) {
      expect(card).toHaveProperty('id');
      expect(card).toHaveProperty('name');
      expect(card).toHaveProperty('rarity');
      expect(card).toHaveProperty('image');
      expect(card).toHaveProperty('price');
      expect(typeof card.price).toBe('number');
    }
  });

  it('lanza error si la API falla', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: false, status: 503, statusText: 'Service Unavailable' })
    );
    await expect(generateBoosterPack()).rejects.toThrow('Error al contactar Scryfall');
  });

  it('los IDs de las cartas son únicos', async () => {
    const pack = await generateBoosterPack();
    const ids = pack.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

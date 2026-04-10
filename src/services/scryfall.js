// This service connects to the Scryfall API to retrieve cards
// To avoid rate limits, we fetch a whole set and distribute the rarities locally.

const SET_CODE = 'blb'; // Bloomburrow, a recent set

let setCardsCache = null;

export const fetchSetCards = async () => {
  if (setCardsCache) return setCardsCache;
  
  let allCards = [];
  let url = `https://api.scryfall.com/cards/search?q=set:${SET_CODE}+-type:basic`;
  
  try {
    // Fetch first page (175 cards usually, which is enough for drafting a pack, but let's just use what we get)
    const response = await fetch(url);
    const data = await response.json();
    allCards = data.data;
    setCardsCache = allCards;
    return allCards;
  } catch (error) {
    console.error("Error fetching from Scryfall:", error);
    return [];
  }
};

export const generateBoosterPack = async () => {
  const cards = await fetchSetCards();
  if (!cards || cards.length === 0) return [];

  // Group by rarity
  const pool = {
    common: cards.filter(c => c.rarity === 'common'),
    uncommon: cards.filter(c => c.rarity === 'uncommon'),
    rare: cards.filter(c => c.rarity === 'rare' || c.rarity === 'mythic'),
    token: cards.filter(c => c.type_line && c.type_line.includes('Token'))
  };

  // If no tokens found in search, fake one
  if (pool.token.length === 0) {
    pool.token = [{
      id: "fake-token",
      name: "Treasure Token",
      rarity: "common", // tokens usually have common rarity on scryfall
      type_line: "Token Artifact - Treasure",
      image_uris: {
        normal: "https://cards.scryfall.io/normal/front/1/7/17b20464-9ca9-4806-a212-e877e5d26392.jpg?1682206013"
      },
      prices: { usd: "0.10" }
    }];
  }

  const getRandom = (arr, count) => {
    let result = [];
    let _arr = [...arr];
    for (let i = 0; i < count; i++) {
        if(_arr.length === 0) break;
        const index = Math.floor(Math.random() * _arr.length);
        result.push(_arr[index]);
        _arr.splice(index, 1);
    }
    return result;
  };

  const pack = [
    ...getRandom(pool.common, 9),
    ...getRandom(pool.uncommon, 4),
    ...getRandom(pool.rare, 1),
    ...getRandom(pool.token, 1)
  ];

  // We need 16 cards, right now we have 9 + 4 + 1 + 1 = 15. 
  // Standard MTG packs often have 1 land or a foil. Let's add 1 extra common or land.
  pack.push(...getRandom(pool.common, 1)); 

  // Shuffle the pack
  return pack.sort(() => Math.random() - 0.5).map(c => ({
    id: c.id + Math.random().toString(), // unique id for list rendering
    name: c.name,
    rarity: c.rarity,
    image: c.image_uris?.normal || c.image_uris?.large || '',
    price: parseFloat(c.prices?.usd || c.prices?.usd_foil || "0.25"),
    selected_for: null // 'PHYSICAL' | 'CREDIT' | null
  }));
};

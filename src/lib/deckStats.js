// app/lib/deckStats.js

// Détecte si la carte est un terrain (pour exclure de la courbe)
export function isLand(card) {
  const t = (card?.type || card?.typeLine || "").toLowerCase();
  return t.includes("land");
}

// Récupère un "mana value" fiable en combinant plusieurs sources possibles
export function getManaValue(card) {
  // champs "classiques"
  const direct =
    card?.manaValue ??
    card?.cmc ??
    card?.convertedManaCost ??
    null;

  if (typeof direct === "number" && !Number.isNaN(direct)) {
    return Math.max(0, Math.floor(direct));
  }

  // faces (split/MDFC) -> on prend le max (prudent pour un deckbuilder)
  const faces = card?.card_faces || card?.faces || card?.cardFaces;
  if (Array.isArray(faces) && faces.length > 0) {
    const values = faces
      .map((f) => f?.manaValue ?? f?.cmc ?? parseManaCost(f?.mana_cost || f?.manaCost))
      .filter((v) => typeof v === "number" && !Number.isNaN(v));
    if (values.length) return Math.max(...values);
  }

  // parse le mana_cost "{1}{U}{U}" etc.
  const parsed = parseManaCost(card?.mana_cost || card?.manaCost);
  return parsed ?? 0;
}

// Parse une string de coût Scryfall: "{1}{U}{U}", "{X}{G}", "{2/U}", "{U/P}", etc.
export function parseManaCost(manaCostStr) {
  if (!manaCostStr || typeof manaCostStr !== "string") return null;
  const tokens = manaCostStr.match(/\{[^}]+\}/g) || [];
  let total = 0;

  for (const raw of tokens) {
    const sym = raw.slice(1, -1).toUpperCase(); // enlève { }

    if (/^\d+$/.test(sym)) {
      total += Number(sym);
      continue;
    }

    if (sym === "X") {
      // On considère X = 0 par défaut (standard pour une courbe)
      continue;
    }

    // Hybrides / phyrexians / "2/U" etc.
    if (sym.includes("/")) {
      // {2/U} -> 2 ; {U/P} -> 1 ; {W/U} -> 1
      const parts = sym.split("/");
      const hasDigit = parts.find((p) => /^\d+$/.test(p));
      total += hasDigit ? Number(hasDigit) : 1;
      continue;
    }

    // Symboles mono (W,U,B,R,G,C,S) -> 1
    if (["W", "U", "B", "R", "G", "C", "S"].includes(sym)) {
      total += 1;
      continue;
    }

    // Fallback: on ignore (tap/untap n’apparaissent normalement pas ici)
  }

  return total;
}

/**
 * Calcule la courbe de mana (0..cap puis "cap+").
 * @param {Array} cards  - cartes "enriched" avec decklistQuantity, type/typeLine, manaValue/cmc/mana_cost...
 * @param {Object} opts  - { excludeLands: true, cap: 7 }
 * @returns {Array<{ mv: string, count: number }>}
 */

// retourne un tableau avec la repartition des cartes par manacost et par type de cartes : Créature/non créature et de 1- à 7+
export function computeManaCurveSplit(cards, opts = {}) {
  const { excludeLands = true, cap = 7, mergeLow = true } = opts;

  const bucketC = new Array(cap + 1).fill(0); // créatures 0..cap (cap = exactement cap)
  const bucketN = new Array(cap + 1).fill(0); // non-créatures 0..cap
  let overC = 0; // créatures > cap
  let overN = 0; // non-créatures > cap

  (cards || []).forEach((card) => {
    const qty = Number(card?.decklistQuantity ?? card?.quantity ?? 0);
    if (!qty) return;

    const typeLine = (card?.type || card?.typeLine || "").toLowerCase();
    if (excludeLands && typeLine.includes("land")) return;

    const isCreature = typeLine.includes("creature");
    const mvRaw = getManaValue(card);
    if (typeof mvRaw !== "number" || Number.isNaN(mvRaw)) return;

    const mv = Math.max(0, Math.floor(mvRaw)); // X → 0, pas de négatifs

    if (mv > cap) {
      if (isCreature) overC += qty;
      else overN += qty;
    } else {
      if (isCreature) bucketC[mv] += qty;
      else bucketN[mv] += qty;
    }
  });

  const data = [];

  if (mergeLow) {
    // "1-" : 0 et 1 combinés
    data.push({
      mv: "1-",
      creatures: (bucketC[0] || 0) + (bucketC[1] || 0),
      nonCreatures: (bucketN[0] || 0) + (bucketN[1] || 0),
    });
    // 2..cap-1
    for (let i = 2; i < cap; i++) {
      data.push({
        mv: String(i),
        creatures: bucketC[i],
        nonCreatures: bucketN[i],
      });
    }
  } else {
    // 0..cap-1 séparés
    for (let i = 0; i < cap; i++) {
      data.push({
        mv: String(i),
        creatures: bucketC[i],
        nonCreatures: bucketN[i],
      });
    }
  }

  // "cap+" = exactement cap + tout ce qui est > cap
  data.push({
    mv: `${cap}+`,
    creatures: bucketC[cap] + overC,
    nonCreatures: bucketN[cap] + overN,
  });

  return data;
}

// retourne un tableau avec la repartition des cartes par manacost, de 1- à 7+
export function computeManaCurve(cards, opts = {}) {
  const { excludeLands = true, cap = 7 } = opts;

  // 0..cap (cap = exactement 7), capPlus = strictement > 7
  const buckets = new Array(cap + 1).fill(0);
  let capPlus = 0;

  (cards || []).forEach((card) => {
    const qty = Number(card?.decklistQuantity ?? card?.quantity ?? 0);
    if (!qty) return;
    if (excludeLands && isLand(card)) return;

    const mvRaw = getManaValue(card);
    if (typeof mvRaw !== "number" || Number.isNaN(mvRaw)) return;
    const mv = Math.max(0, Math.floor(mvRaw));

    if (mv > cap) {
      capPlus += qty;            // ✅ uniquement dans cap+
    } else {
      buckets[mv] += qty;        // ✅ 0..cap (cap = exactement cap)
    }
  });

  const data = [];
  for (let i = 0; i < cap; i++) data.push({ mv: String(i), count: buckets[i] });
  data.push({ mv: `${cap}+`, count: buckets[cap] + capPlus }); // ✅ 7 + (strictement >cap) + exactement cap

  return data;
}

export function getCardColors(card) {
  // Priorité : "colors" (coût réel) puis "color_identity"
  let cols =
    card?.colors ??
    card?.colorIdentity ??
    card?.color_identity ??
    null;

  if (typeof cols === "string") cols = cols.split(""); // ex: "WU" -> ["W","U"]
  if (!Array.isArray(cols)) cols = [];

  const set = new Set(
    cols
      .map((c) => String(c).toUpperCase())
      .filter((c) => ["W", "U", "B", "R", "G"].includes(c))
  );

  return set.size ? Array.from(set) : ["C"]; // incolore si rien
}

//retourne un tableau avec la répartition des cartes par couleur
export function computeColorDistribution(cards, opts = {}) {
  const {
    excludeLands = true,
    splitMulticolor = true,
    includeColorless = true,
  } = opts;

  const totals = { W: 0, U: 0, B: 0, R: 0, G: 0, ...(includeColorless ? { C: 0 } : {}) };

  (cards || []).forEach((card) => {
    const qty = Number(card?.decklistQuantity ?? card?.quantity ?? 0);
    if (!qty) return;
    if (excludeLands && isLand(card)) return;

    const colors = getCardColors(card).filter((c) => totals[c] !== undefined);
    if (!colors.length) return;

    const share = splitMulticolor ? qty / colors.length : qty;
    colors.forEach((c) => {
      totals[c] += share;
    });
  });

  const order = includeColorless ? ["W", "U", "B", "R", "G", "C"] : ["W", "U", "B", "R", "G"];
  const data = order
    .map((k) => ({ key: k, value: Number(totals[k].toFixed(2)) }))
    .filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);
  return { data, total };
}
// Normalized MTG card helpers — single source of truth
// ----------------------------------------------------
import React from "react";
import manaSymbols from "../app/assets/mock/mana.json";

/** ------- Mana helpers ------- **/

/**
 * Calcule le CMC numérique à partir d'une string "{...}".
 * - Nombres => valeur
 * - Hybrides/Phyrexian/Non numériques => 1
 * - X/Y/Z => 0
 * @param {string|undefined|null} manaCost
 * @returns {number}
 */
export function parseManaCostNumeric(manaCost) {
  if (!manaCost) return 0;
  const tokens = String(manaCost).match(/\{[^}]+\}/g) || [];
  let sum = 0;
  for (const tok of tokens) {
    const sym = tok.slice(1, -1).toUpperCase().trim();
    if (/^\d+$/.test(sym)) {
      sum += Number(sym);
    } else if (sym.includes("/")) {
      // ex: {W/U}, {2/W}, {W/P}...
      const parts = sym.split("/");
      const numeric = parts.find((p) => /^\d+$/.test(p));
      sum += numeric ? Number(numeric) : 1;
    } else if (sym === "X" || sym === "Y" || sym === "Z") {
      sum += 0;
    } else {
      sum += 1;
    }
  }
  return sum;
}

/**
 * Rend le coût de mana en icônes (conserve la compat avec l’ancien formatAndParseText).
 * @param {string|undefined|null} manaCost
 * @returns {React.ReactNode}
 */
export function renderManaCost(manaCost) {
  if (!manaCost) return null;
  return String(manaCost)
    .split("\n")
    .map((line, lineIndex) => (
      <span key={lineIndex}>
        {line
          .split(/(\{[^}]+\})/g)
          .filter(Boolean)
          .map((symbol, symbolIndex) => {
            const found = (manaSymbols?.data || []).find((e) => e.symbol === symbol);
            return found ? (
              <img
                key={`${lineIndex}-${symbolIndex}`}
                src={found.svg_uri}
                alt={symbol}
              />
            ) : (
              symbol
            );
          })}
        <br />
      </span>
    ));
}

export const formatAndParseText = (text) => {
if (!text) return null;
return text.split("\n").map((line, lineIndex) => (
    <span key={lineIndex}>
    {line.split(/(\{[^}]+\})/g).filter(Boolean).map((symbol, symbolIndex) => {
        const foundSymbol = manaSymbols.data.find(entry => entry.symbol === symbol);
        return foundSymbol ? (
        <img key={`${lineIndex}-${symbolIndex}`} src={foundSymbol.svg_uri} alt={symbol} />
        ) : (
        symbol
        );
    })}
    <br />
    </span>
));
};

/**
 * MV/CMC d’une carte (prend les champs numériques si présents, sinon parse la string de mana).
 * @param {any} card
 * @returns {number}
 */
export function getMV(card) {
  const cand = [card?.manaValue, card?.cmc, card?.convertedManaCost].find(
    (v) => v !== undefined && v !== null && Number.isFinite(Number(v))
  );
  if (cand !== undefined) return Math.max(0, Math.floor(Number(cand)));
  return Math.max(0, Math.floor(parseManaCostNumeric(card?.manaCost)));
}

/** Buckets CMC utilisés partout */
export const BUCKETS = ["1-", "2", "3", "4", "5", "6", "7+"];
/**
 * Label de bucket pour un MV.
 * @param {number} mv
 * @returns {"1-"|"2"|"3"|"4"|"5"|"6"|"7+"}
 */
export function bucketLabel(mv) {
  return mv <= 1 ? "1-" : mv >= 7 ? "7+" : String(mv);
}

/** ------- Type helpers ------- **/

export const TYPE_ORDER = [
  "creature",
  "instant",
  "sorcery",
  "enchantment",
  "artifact",
  "planeswalker",
  "battle",
  "land",
  "other",
];

/**
 * Type principal (catégories cohérentes avec l’UI).
 * @param {any} card
 * @returns {string}
 */
export function primaryTypeOf(card) {
  const t = (card?.type || card?.typeLine || "").toLowerCase();
  if (t.includes("land")) return "land";
  if (t.includes("creature")) return "creature";
  if (t.includes("instant")) return "instant";
  if (t.includes("sorcery")) return "sorcery";
  if (t.includes("enchantment")) return "enchantment";
  if (t.includes("artifact")) return "artifact";
  if (t.includes("planeswalker")) return "planeswalker";
  if (t.includes("battle")) return "battle";
  return "other";
}

/** @param {any} card */
export const isLand = (card) => primaryTypeOf(card) === "land";

/** ------- Color helpers ------- **/

export const COLOR_ORDER = ["W", "U", "B", "R", "G", "M", "C"];

/**
 * Extrait W/U/B/R/G d’une string de mana (hybrides compris).
 * @param {string|undefined|null} manaCost
 * @returns {Array<"W"|"U"|"B"|"R"|"G">}
 */
export function colorsFromManaCost(manaCost) {
  if (!manaCost) return [];
  const tokens = String(manaCost).match(/\{[^}]+\}/g) || [];
  const set = new Set();
  for (const tok of tokens) {
    const sym = tok.slice(1, -1).toUpperCase();
    if (["W", "U", "B", "R", "G"].includes(sym)) set.add(sym);
    sym.split("/").forEach((s) => {
      if (["W", "U", "B", "R", "G"].includes(s)) set.add(s);
    });
  }
  return Array.from(set);
}

/**
 * Bucket de couleur (W/U/B/R/G/M/C) avec priorité :
 * colors → colorIdentity/color_identity → manaCost → C
 * @param {any} card
 * @returns {"W"|"U"|"B"|"R"|"G"|"M"|"C"}
 */
export function colorBucketOf(card) {
  let cols = [];
  if (Array.isArray(card?.colors) && card.colors.length) cols = card.colors;
  else if (Array.isArray(card?.colorIdentity) && card.colorIdentity.length) cols = card.colorIdentity;
  else if (Array.isArray(card?.color_identity) && card.color_identity.length) cols = card.color_identity;
  else cols = colorsFromManaCost(card?.manaCost);

  const norm = cols
    .map(String)
    .map((c) => c.toUpperCase())
    .filter((c) => ["W", "U", "B", "R", "G"].includes(c));

  if (norm.length === 0) return "C";
  if (norm.length >= 2) return "M";
  return norm[0];
}

/** ------- Rarity helpers ------- **/

/**
 * @param {any} card
 * @returns {"common"|"uncommon"|"rare"|"mythic"|"special"|"other"}
 */
export function rarityKeyOf(card) {
  const r =
    (card?.rarity || card?.printedRarity || card?.rarityKey || "")
      .toString()
      .toLowerCase()
      .trim();

  if (r === "common") return "common";
  if (r === "uncommon") return "uncommon";
  if (r === "rare") return "rare";
  if (r === "mythic" || r === "mythic rare") return "mythic";
  if (r === "special" || r === "bonus" || r === "timeshifted") return "special";
  return "other";
}

/** ------- Images / Showcase helpers ------- **/

/**
 * Image petite (pour table / list).
 * @param {any} card
 * @returns {string|null}
 */
export function getArtSmall(card) {
  return (
    card?.image?.artCrop ||
    card?.cardBack?.image?.artCrop ||
    card?.image?.normal ||
    null
  );
}

/**
 * Image grande (pour preview hover).
 * @param {any} card
 * @returns {string|null}
 */
export function getArtLarge(card) {
  return (
    card?.image?.large ||
    card?.image?.normal ||
    card?.image?.artCrop ||
    card?.cardBack?.image?.artCrop ||
    null
  );
}

/**
 * Payload pour setShowcased (resté proche de l’existant).
 * @param {any} card
 * @returns {string|null}
 */
export function getShowcasePayload(card) {
  return (
    card?.image?.artCrop ||
    card?.cardBack?.image?.artCrop ||
    card?.image?.normal ||
    null
  );
}

/** ------- Tiny utils ------- **/

/** @param {any} card */ export const getName = (card) => String(card?.name || card?.printedName || "");
/** @param {any} card */ export const getQty  = (card) => Number(card?.decklistQuantity || 0);

/** ------- Default export (optionnel) ------- **/
export default {
  // mana
  parseManaCostNumeric,
  renderManaCost,
  getMV,
  BUCKETS,
  bucketLabel,
  // type
  primaryTypeOf,
  isLand,
  TYPE_ORDER,
  // color
  colorsFromManaCost,
  colorBucketOf,
  COLOR_ORDER,
  // rarity
  rarityKeyOf,
  // images
  getArtSmall,
  getArtLarge,
  getShowcasePayload,
  // tiny utils
  getName,
  getQty,
};

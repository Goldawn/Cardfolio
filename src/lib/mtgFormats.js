// app/lib/mtgFormats.js

/** Clé canonique -> libellé utilisateur */
export const FORMAT_LABELS = {
  commander:        "Commander",
  paupercommander:  "Pauper Commander",
  oathbreaker:      "Oathbreaker",
  gladiator:        "Gladiator",
  brawl:            "Brawl",
  standardbrawl:    "Standard Brawl",
  vintage:          "Vintage",
  legacy:           "Legacy",
  modern:           "Modern",
  pioneer:          "Pioneer",
  standard:         "Standard",
  historic:         "Historic",
  timeless:         "Timeless",
  alchemy:          "Alchemy",
  penny:            "Penny Dreadful",
};

/** Descriptions FR (affichage, tooltips) */
export const FORMAT_DESCRIPTIONS = {
  commander:
    "100 cartes, singleton (1 exemplaire max), un commandant légendaire. Terrains de base non limités.",
  paupercommander:
    "100 cartes, singleton, commandant (souvent uncommon), le reste en commune. Terrains de base non limités.",
  oathbreaker:
    "60 cartes, singleton, 1 planeswalker + 1 signature spell. Terrains de base non limités.",
  gladiator:
    "100 cartes, singleton. Terrains de base non limités.",
  brawl:
    "60 cartes, singleton, Standard only, 1 commandant légendaire. Terrains de base non limités.",
  standardbrawl:
    "60 cartes, singleton, pool Standard. Terrains de base non limités.",
  vintage:
    "60+ cartes, certaines cartes restreintes à 1 (ex.: Ancestral Recall).",
  modern:
    "60+ cartes, max 4 exemplaires sauf cartes explicitement illimitées.",
  legacy:
    "60+ cartes, max 4 exemplaires sauf cartes explicitement illimitées.",
  pioneer:
    "60+ cartes, max 4 exemplaires sauf cartes explicitement illimitées.",
  standard:
    "60+ cartes, max 4 exemplaires sauf cartes explicitement illimitées.",
  historic:
    "60+ cartes, format Arena.",
  timeless:
    "60+ cartes, Arena (pool étendu).",
  alchemy:
    "60+ cartes, Arena + cartes digitales.",
  penny:
    "60+ cartes, budget (MTGO).",
};

/**
 * Métadonnées minimales pour la validation/affichage.
 * NB: on reste volontairement générique sur les “exceptions illimitées”.
 */
export const FORMAT_RULES = {
  commander:       { minMain: 100, singleton: true, maxCopies: 1, commanderLike: true, arena: false },
  paupercommander: { minMain: 100, singleton: true, maxCopies: 1, commanderLike: true, arena: false, rarityRule: "reste en commune" },
  oathbreaker:     { minMain: 60,  singleton: true, maxCopies: 1, commanderLike: true, signatureSpell: true, arena: false },
  gladiator:       { minMain: 100, singleton: true, maxCopies: 1, arena: false },
  brawl:           { minMain: 60,  singleton: true, maxCopies: 1, commanderLike: true, pool: "standard", arena: true },
  standardbrawl:   { minMain: 60,  singleton: true, maxCopies: 1, pool: "standard", arena: true },
  vintage:         { minMain: 60,  singleton: false, maxCopies: 4, restrictedList: true },
  modern:          { minMain: 60,  singleton: false, maxCopies: 4, unlimitedExceptions: true },
  legacy:          { minMain: 60,  singleton: false, maxCopies: 4, unlimitedExceptions: true },
  pioneer:         { minMain: 60,  singleton: false, maxCopies: 4, unlimitedExceptions: true },
  standard:        { minMain: 60,  singleton: false, maxCopies: 4, pool: "standard" },
  historic:        { minMain: 60,  singleton: false, maxCopies: 4, arena: true },
  timeless:        { minMain: 60,  singleton: false, maxCopies: 4, arena: true },
  alchemy:         { minMain: 60,  singleton: false, maxCopies: 4, arena: true },
  penny:           { minMain: 60,  singleton: false, maxCopies: 4 },
};

/** Helpers pratiques (UI) */
export function getFormatLabel(key) {
  return FORMAT_LABELS[key] ?? key;
}
export function getFormatDescription(key) {
  return FORMAT_DESCRIPTIONS[key] ?? "";
}
export function getFormatMeta(key) {
  return FORMAT_RULES[key] ?? null;
}

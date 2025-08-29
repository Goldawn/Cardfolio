// Icons — préfère un alias "../app/assets/…" si c'est déjà configuré
// import W  from "../app/assets/images/icons/W.svg";
import W  from "../app/assets/images/icons/W.svg"
import U  from "../app/assets/images/icons/U.svg";
import B  from "../app/assets/images/icons/B.svg";
import R  from "../app/assets/images/icons/R.svg";
import G  from "../app/assets/images/icons/G.svg";
import C  from "../app/assets/images/icons/C.svg";
import M  from "../app/assets/images/icons/M.svg";

import Artifact     from "../app/assets/images/icons/Artifact.svg";
import Battle       from "../app/assets/images/icons/Battle.svg";
import Commander    from "../app/assets/images/icons/Commander.svg";
import Creature     from "../app/assets/images/icons/Creature.svg";
import Enchantment  from "../app/assets/images/icons/Enchantment.svg";
import Instant      from "../app/assets/images/icons/Instant.svg";
import Land         from "../app/assets/images/icons/Land.svg";
import Planeswalker from "../app/assets/images/icons/Planeswalker.png";
import Sorcery      from "../app/assets/images/icons/Sorcery.svg";

// 1) Registre brut
export const ICON = {
  W, U, B, R, G, C, M,
  Artifact, Battle, Commander, Creature, Enchantment, Instant,
  Land, Planeswalker, Sorcery,
};

// 2) Métadonnées "Deck Header"
export const COLOR_META = {
  W: { label: "Blanc",     icon: W },
  U: { label: "Bleu",      icon: U },
  B: { label: "Noir",      icon: B },
  R: { label: "Rouge",     icon: R },
  G: { label: "Vert",      icon: G },
  C: { label: "Incolore",  icon: C },
  M: { label: "Multicolore", icon: M },
};

export const TYPE_META = {
  land:         { label: "Terrain",       icon: Land },
  creature:     { label: "Créature",      icon: Creature },
  instant:      { label: "Éphémère",      icon: Instant },
  sorcery:      { label: "Rituel",        icon: Sorcery },
  artifact:     { label: "Artefact",      icon: Artifact },
  enchantment:  { label: "Enchantement",  icon: Enchantment },
  planeswalker: { label: "Planeswalker",  icon: Planeswalker },
  battle:       { label: "Bataille",      icon: Battle },
  commander:    { label: "Commandant",    icon: Commander },
};

export const RARITY_META = {
  common:   { label: "Commune",       color: "#95a5a6" }, // gris
  uncommon: { label: "Peu commune",   color: "#bdc3c7" }, // argent
  rare:     { label: "Rare",          color: "#f1c40f" }, // or
  mythic:   { label: "Mythique",      color: "#e67e22" }, // orange
  special:  { label: "Spéciale",      color: "#9b59b6" }, // optionnel
  other:    { label: "Autre",         color: "#7f8c8d" },
};

// 3) Listes pour les filtres (équivalent de ActionBarConfig)
export const colorFilterElements = [
  { name: "White",      letter: "W", icon: W },
  { name: "Blue",       letter: "U", icon: U },
  { name: "Black",      letter: "B", icon: B },
  { name: "Red",        letter: "R", icon: R },
  { name: "Green",      letter: "G", icon: G },
  { name: "Colorless",  letter: "C", icon: C },
  { name: "Multicolor", letter: "M", icon: M },
];

export const typeFilterElements = [
  { name: "Artifact",     icon: Artifact },
  { name: "Battle",       icon: Battle },
  { name: "Commander",    icon: Commander },
  { name: "Creature",     icon: Creature },
  { name: "Enchantment",  icon: Enchantment },
  { name: "Instant",      icon: Instant },
  { name: "Land",         icon: Land },
  { name: "Planeswalker", icon: Planeswalker },
  { name: "Sorcery",      icon: Sorcery },
];

export const rarityFilterElements = [
  { name: "common",    icon: "" },
  { name: "uncommon",  icon: "" },
  { name: "rare",      icon: "" },
  { name: "mythic",    icon: "" },
];

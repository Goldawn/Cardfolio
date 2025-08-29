import { getMV } from "@/lib/mtgCards"

export const sortByName = (a, b) =>
  String(a.name || a.printedName).localeCompare(String(b.name || b.printedName), "fr", { sensitivity: "base" });

export const sortByMVThenName = (a, b) =>
  (Number(a.mv ?? a.manaValue ??  getMV(a)) - Number(b.mv ?? b.manaValue ?? getMV(b))) || sortByName(a, b);

// Petit util split (round-robin)
export const splitIntoN = (arr, n) => {
  const buckets = Array.from({ length: Math.max(1, n|0) }, () => []);
  arr.forEach((x, i) => buckets[i % buckets.length].push(x));
  return buckets;
};

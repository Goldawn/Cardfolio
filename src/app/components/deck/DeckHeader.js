import { useMemo, Fragment } from "react";
import Image from "next/image";
import { COLOR_META, TYPE_META, RARITY_META } from "@/lib/mtgIcons";
import { getFormatLabel, getFormatDescription, getFormatMeta } from "@/lib/mtgFormats";
import { computeManaCurveSplit, computeColorDistribution } from "@/lib/deckStats";
import { BarChart, Bar, ResponsiveContainer, XAxis, PieChart, Pie, Cell, Legend, Tooltip as RTooltip } from 'recharts';
import styles from "./DeckHeader.module.css"

export default function DeckHeader ({deck, colors, cards}) {

const manaCurve = useMemo(() => computeManaCurveSplit(cards, { excludeLands: true, cap: 7 }), [cards]);
const colorDist = useMemo(() => computeColorDistribution(cards, { excludeLands: true, splitMulticolor: true, includeColorless: true }),[cards]);

const COLOR_FILL = {
  W: "#F5F1DC",
  U: "#74B0F2",
  B: "#5A5A5A",
  R: "#FF7A70",
  G: "#81C784",
  C: "#CFCFCF",
};

  const artUrl = useMemo(() => {
    if (deck?.showcasedArt) return deck.showcasedArt;

    const pickImage = (c) =>
      c?.image?.artCrop ||
      c?.cardBack?.image?.artCrop ||
      c?.image?.large ||
      c?.image?.normal ||
      null;

    const showcased = cards?.find(c => c.deckCardId === deck?.showcasedDeckCardId);
    return pickImage(showcased) || pickImage(cards?.[0]) || null;
  }, [deck?.showcasedArt, deck?.showcasedDeckCardId, cards]);

  const typeCounts = useMemo(() => {
    const out = {
      land: 0, creature: 0, instant: 0, sorcery: 0,
      artifact: 0, enchantment: 0, planeswalker: 0, battle: 0, other: 0,
    };
    (cards || []).forEach((card) => {
      const qty = Number(card?.decklistQuantity || 0);
      if (!qty) return;
      const t = (card?.type || card?.typeLine || "").toLowerCase();

      if (t.includes("land")) out.land += qty;
      else if (t.includes("creature")) out.creature += qty;
      else if (t.includes("instant")) out.instant += qty;
      else if (t.includes("sorcery")) out.sorcery += qty;
      else if (t.includes("artifact")) out.artifact += qty;
      else if (t.includes("enchantment")) out.enchantment += qty;
      else if (t.includes("planeswalker")) out.planeswalker += qty;
      else if (t.includes("battle")) out.battle += qty;
      else out.other += qty;
    });
    return out;
  }, [cards]);

  const rarityCounts = useMemo(() => {
    const out = { common: 0, uncommon: 0, rare: 0, mythic: 0, special: 0, other: 0 };
    (cards || []).forEach((card) => {
      const qty = Number(card?.decklistQuantity || 0);
      if (!qty) return;
      const r = (card?.rarity || "").toLowerCase();
      if (r in out) out[r] += qty;
      else out.other += qty;
    });
    return out;
  }, [cards]);

  const ColorPip = ({ c }) => {
    const meta = COLOR_META[c];
    if (!meta?.icon) return <span className={styles.colorPip}>{c}</span>;
    return (
        <Image
        src={meta.icon}
        alt={meta.label}
        width={24}
        height={24}
        className={styles.colorIcon}
        title={meta.label}
        />
    );
    };

  return (
    <div className={styles.deckHeaderBanner}>

      <div className={styles.bannerArt}>
        {artUrl ? (
          <img src={artUrl} alt={`Illustration du deck ${deck?.name || ""}`} />
        ) : (
          <div className={styles.bannerArtPlaceholder}>Aucune illustration</div>
        )}
      </div>

      <div className={styles.bannerBody}>
        <div className={styles.bannerTitleRow}>
          <h1 className={styles.bannerTitle}>{deck?.name}</h1>
        </div>

        <div className={styles.bannerSubRow}>
          <FormatBadge format={deck?.format} />
            {(colors || []).length > 0 ? (
              colors.map((c) => <ColorPip key={c} c={c} />)
              ) : (
                  <span className={styles.noColors}>—</span>
              )}
        </div>

        <ul className={styles.typeCounts}>
          {Object.entries(TYPE_META).map(([key, meta]) => {
            const count = typeCounts[key] || 0;
            if (count <= 0) return null;
            return (
              <li key={key} className={styles.typeCountItem} title={meta.label}>
                 {meta.icon ? (
                    <Image
                        src={meta.icon}
                        alt={meta.label}
                        width={20}
                        height={20}
                        className={styles.typeIconImg}
                    />
                ) : (
                    <span className={styles.typeIconFallback}>•</span>
                )}
                {/* <span className={styles.typeLabel}>{meta.label}</span> */}
                <span className={styles.typeNumber}>{count}</span>
              </li>
            );
          })}
        </ul>

        <ul className={styles.rarityCounts}>
          {Object.entries(RARITY_META).map(([key, meta]) => {
            const count = rarityCounts[key] || 0;
            if (count <= 0) return null;
            return (
              <li key={key} className={styles.rarityItem} title={meta.label}>
                {/* Pastille couleur (ou icône si tu en ajoutes plus tard) */}
                <span
                  className={styles.rarityDot}
                  aria-hidden
                  style={{ backgroundColor: meta.color }}
                />
                {/* <span className={styles.rarityLabel}>{meta.label}</span> */}
                <span className={styles.rarityNumber}>{count}</span>
              </li>
            );
          })}
        </ul>
      </div>

        {/* Répatition par coût de mana converti */}
        <div className={styles.bannerChart}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={manaCurve}>
                    <defs>
                        <linearGradient id="colorCreatures" x1="1" y1="1">
                            <stop offset="0" stopColor="rgba(255, 238, 89, 1)"/>
                            <stop offset="1" stopColor="rgba(255, 94, 0, 1)"/>
                        </linearGradient>
                        <linearGradient id="colorNonCreatures" x1="1" y1="1">
                            <stop offset="0" stopColor="rgba(40, 145, 231, 1)"/>
                            <stop offset="1" stopColor="rgba(40, 115, 175, 1)"/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="mv" axisLine={false} tickLine={false} tick={{fill: '#fff'}}/>
                    <RTooltip
                        formatter={(value, key) => {
                        const label = key === "creatures" ? "Créatures" : "Non-créatures";
                        return [`${value} carte${value > 1 ? "s" : ""}`, label];
                        }}
                        labelFormatter={(label) => `Coût converti ${label}`}
                    />
                   
                     <Bar
                        dataKey="creatures"
                        name="Créatures"
                        stackId="a"
                        fill="url(#colorCreatures)"
                    />
                    <Bar
                        dataKey="nonCreatures"
                        name="Non-créatures"
                        stackId="a"
                        fill="url(#colorNonCreatures)"
                    />
                    {/* <Legend /> */}
                </BarChart>
            </ResponsiveContainer>
        </div>

         {/* 2) Répartition des couleurs (terrains exclus) */}
        <div className={styles.chartBlock}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={colorDist.data}
                        dataKey="value"
                        // nameKey="key"
                        paddingAngle={3}
                        innerRadius="45%"
                        outerRadius="80%"
                        isAnimationActive={false}
                        stroke={false}
                        >
                        {colorDist.data.map((entry) => (
                            <Cell key={entry.key} fill={COLOR_FILL[entry.key] || "#999"} />
                        ))}
                    </Pie>
                    <RTooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const p = payload[0];
                            const k = p?.payload?.key;
                            const label = COLOR_META[k]?.label ?? k;
                            const val = p?.value ?? 0;
                            const pct = colorDist.total ? Math.round((val / colorDist.total) * 100) : 0;
                            return (
                            <div style={{ background: "rgba(0,0,0,0.7)", color: "#fff", padding: 8, borderRadius: 6 }}>
                                <div><strong>{label}</strong></div>
                                <div>{val.toFixed(1)} carte{val >= 2 ? "s" : ""}</div>
                                <div>{pct}%</div>
                            </div>
                            );
                        }}
                    />
                    </PieChart>
            </ResponsiveContainer>
        </div>
    </div>

    
  );
}

function FormatBadge({ format }) {
  if (!format) return null;

  const label = getFormatLabel(format);
  const desc  = getFormatDescription(format);
  const title = desc ? `${label} : ${desc}` : label;

  return (
    <span
      className={styles.formatBadge}
      title={title}
      aria-label={title}
      tabIndex={0} // focusable au clavier -> tooltip natif sur focus
    >
      {/* Format : <strong>{label}</strong> */}
    <strong>{label}</strong>
    </span>
  );
}
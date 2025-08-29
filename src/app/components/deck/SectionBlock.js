"use client";
import Image from "next/image";
import styles from "./DeckCardsTabs.module.css";

/**
 * En-tête + conteneur de section (type, couleur, CMC…)
 * Props:
 * - title: string
 * - count: number
 * - icon?: { src, alt, w=18, h=18 } | null
 * - children: contenu (table/liste)
 */
export default function SectionBlock({ title, count, icon = null, children }) {
  return (
    <section className={styles.typeSection}>
      <header className={styles.sectionHeader}>
        {icon ? (
          <Image
            src={icon.src}
            alt={icon.alt || title}
            width={icon.w ?? 18}
            height={icon.h ?? 18}
            className={styles.sectionIcon}
          />
        ) : (
          <span className={styles.typeIconFallback}>•</span>
        )}
        <h3 className={styles.sectionTitle}>{title}</h3>
        <span className={styles.sectionBadge}>×{count}</span>
      </header>
      {children}
    </section>
  );
}

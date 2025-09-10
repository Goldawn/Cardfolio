// Affiche un aperçu lisible selon le type de summary (collection ou deck Arena)

import React from "react"
import type { ImportSummaryArena, ImportSummaryCollection } from "../services/Import_Export/Parsers"
import styles from "./ImportPreview.module.css"

export type ImportPreviewProps = {
  summary: ImportSummaryCollection | ImportSummaryArena
  maxRows?: number
}

export default function ImportPreview({ summary, maxRows = 200 }: ImportPreviewProps) {
  if (summary.kind === "collection") {
    const s = summary as ImportSummaryCollection
    const rows = s.items.slice(0, maxRows)
    return (
      <div className={styles.wrapper}>
        <div className={styles.meta}>Collection — {s.items.length} ligne(s) valides</div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>scryfallId</th>
                <th>quantity</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((it, i) => (
                <tr key={i}>
                  <td className={styles.mono}>{it.scryfallId}</td>
                  <td>{it.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {s.errors.length > 0 && (
          <div className={styles.errors}>{s.errors.length} erreur(s). Les lignes invalides seront ignorées.</div>
        )}
      </div>
    )
  }

  const s = summary as ImportSummaryArena
  const rows = s.entries.slice(0, maxRows)
  return (
    <div className={styles.wrapper}>
      <div className={styles.meta}>Deck (Arena) — {s.entries.length} carte(s)</div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>zone</th>
              <th>qty</th>
              <th>name</th>
              <th>(set)</th>
              <th>#</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e, i) => (
              <tr key={i}>
                <td>{e.zone}</td>
                <td>{e.quantity}</td>
                <td>{e.name}</td>
                <td>{e.set ?? ""}</td>
                <td>{e.collectorNumber ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {s.errors.length > 0 && (
        <div className={styles.errors}>{s.errors.length} erreur(s). Les lignes invalides seront ignorées.</div>
      )}
    </div>
  )
}

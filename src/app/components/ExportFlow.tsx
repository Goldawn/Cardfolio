// Petit lanceur d'export : bouton qui ouvre ExportModal avec les bons props

import React, { useState } from "react"
import ExportModal from "./ExportModal"
import type { ExportKind } from "./ExportModal"
import type { CollectionRow, DeckShape, ArenaOptions } from "../services/Import_Export/Formatters"
import styles from "./ExportFlow.module.css"

export type ExportFlowProps = {
  kind: ExportKind
  data: CollectionRow[] | DeckShape
  filenameBase?: string
  defaultFormat?: "json" | "csv" | "arena"
  label?: string
  variant?: "primary" | "secondary"
  // options pass-through
  csvSeparator?: "," | ";"
  includeSet?: boolean
  nameResolver?: ArenaOptions["nameResolver"]
  onExported?: (filename: string) => void
}

export default function ExportFlow({
  kind,
  data,
  filenameBase,
  defaultFormat,
  label = "Exporter…",
  variant = "primary",
  csvSeparator,
  includeSet,
  nameResolver,
  onExported,
}: ExportFlowProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={variant === "primary" ? styles.btnPrimary : styles.btnSecondary}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>

      <ExportModal
        open={open}
        onClose={() => setOpen(false)}
        kind={kind}
        data={data}
        defaultFormat={defaultFormat}
        filenameBase={filenameBase}
        csvOptions={{ separator: csvSeparator ?? "," }}
        arenaOptions={{ includeSet: !!includeSet, nameResolver }}
        onExported={onExported}
      />
    </>
  )
}

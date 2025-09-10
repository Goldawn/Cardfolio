"use client"
import { useState } from 'react'
import SimpleModal from '../../components/SimpleModal'
import ImportFlow from '@/app/components/ImportFlow'
import { applyImport } from '@/app/services/Import_Export/ImportApi'
import styles from './page.module.css'

export default function Stats() {

  const [open, setOpen] = useState(false);

  return (
    <>
        <ImportFlow
          onApply={async ({ destinations, mode, summary, file }) => {
            const res = await applyImport({ destinations, mode, summary, file });
            if (!res.ok) {
              console.error(res.details);
              alert(res.error);
              return;
            }
            console.log(res.details); // résultats par destination
            alert(res.message ?? "Import OK");
          }}
          defaultDestinations={["collection"]}  // cochées par défaut
        />
    </>
  )
}
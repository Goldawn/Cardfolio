'use client'
import { saveData, loadData, deleteData } from '../services/LocalStorage'
import type { JSX } from 'react'

export default function StorageButtons(): JSX.Element {
  return (
    <div>
      <button onClick={() => saveData('test', 'testvalue')}>Save</button>
      <button onClick={() => loadData('test')}>Load</button>
      <button onClick={() => deleteData('test')}>Delete</button>
    </div>
  )
}

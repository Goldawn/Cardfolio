'use client';
import { saveData, loadData, deleteData } from "../services/LocalStorage";

export default function StorageButtons() {
  return (
    <div>
      <button onClick={() => saveData("test", "testvalue")}>Save</button>
      <button onClick={() => loadData("test")}>Load</button>
      <button onClick={() => deleteData("test")}>Delete</button>
    </div>
  )
}
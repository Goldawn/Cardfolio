"use client";

import { useState } from "react";
import styles from "./WishlistList.module.css";

export default function WishlistList({ list, onRename, onDelete }) {
  console.log(list)
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(list.name);

  const handleRename = () => {
    if (!editedName.trim()) return;
    onRename(editedName);
    setIsEditing(false);
  };

  return (
    <div className={styles.wishlistList}>
      {isEditing ? (
        <div className={styles.editContainer}>
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
          />
          <button onClick={handleRename}>valider</button>
          <button onClick={() => setIsEditing(false)}>annuler</button>
        </div>
      ) : (
        <>
          <h3>{list.name}</h3>
          <p>{list.items?.length || 0} carte(s) unique(s)</p>
          <p>{list.totalQuantity || 0} carte(s) au total</p>
          <div className={styles.actions}>
            <button onClick={() => setIsEditing(true)}>Renommer</button>
            <button onClick={() => onDelete(list.id)}>Supprimer</button>
          </div>
        </>
      )}
    </div>
  );
}

import styles from "./CollectionActionBar.module.css";
import Image from "next/image";

import HautBas from "../assets/images/icons/haut-bas.png"

import {
  colorFilterElements,
  typeFilterElements,
  rarityFilterElements,
} from "@/lib/mtgIcons";

export default function CollectionActionBar({
  selectedColors,
  toggleColorFilter,
  selectedTypes,
  toggleTypeFilter,
  selectedRarities,
  toggleRarityFilter,
  sortOption,
  setSortOption,
  sortOrderAsc,
  toggleSortOrder,
}) {

  return (
    <div className={styles.collectionActionBar}>
      <div className={styles.filterBar}>
        {colorFilterElements.map((color) => (
          <div
            key={color.letter}
            className={`${styles.colorIcon} ${selectedColors.includes(color.letter) ? styles.active : ""}`}
            onClick={() => toggleColorFilter(color.letter)}
          >
            <Image title={color.name} src={color.icon} alt={color.name} width={32} height={32} />
          </div>
        ))}
      </div>

      <div className={styles.filterBar}>
        {typeFilterElements.map((type) => (
          <div
            key={type.name}
            className={`${styles.typeIcon} ${selectedTypes.includes(type.name) ? styles.active : ""}`}
            onClick={() => toggleTypeFilter(type.name)}
          >
            <Image title={type.name} src={type.icon} alt={type.name} />
          </div>
        ))}
      </div>

      <div className={styles.filterBar}>
        {rarityFilterElements.map((rarity) => (
          <div
            title={rarity.name}
            key={rarity.name}
            className={`${styles.rarityIcon} ${styles[rarity.name]} ${selectedRarities.includes(rarity.name) ? styles.active : ""}`}
            onClick={() => toggleRarityFilter(rarity.name)}
          ></div>
        ))}
      </div>

      <div className={styles.sortControls}>    
        <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
          <option value="name">Nom</option>
          <option value="price">Prix</option>
          <option value="date">Date d'ajout</option>
          <option value="set">Set</option>
          <option value="color">Couleur</option>
          <option value="rarity">Rareté</option>
        </select>
        <button onClick={toggleSortOrder} className={styles.sortIcon}>
          <Image src={HautBas} alt="change order"/>
        </button>
      </div>
    </div>
  );
}
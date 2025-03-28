import styles from "./CollectionActionBar.module.css";
import Image from "next/image";

import HautBas from "../assets/images/icons/haut-bas.png"

import White from "../assets/images/icons/W.svg";
import Blue from "../assets/images/icons/U.svg";
import Black from "../assets/images/icons/B.svg";
import Red from "../assets/images/icons/R.svg";
import Green from "../assets/images/icons/G.svg";
import Colorless from "../assets/images/icons/C.svg";
import Multicolor from "../assets/images/icons/M.svg";

import Artifact from "../assets/images/icons/Artifact.svg";
import Battle from "../assets/images/icons/Battle.svg";
import Commander from "../assets/images/icons/Commander.svg";
import Creature from "../assets/images/icons/Creature.svg";
import Enchantment from "../assets/images/icons/Enchantment.svg";
import Instant from "../assets/images/icons/Instant.svg";
import Land from "../assets/images/icons/Land.svg";
import Planeswalker from "../assets/images/icons/Planeswalker.png";
import Sorcery from "../assets/images/icons/Sorcery.svg";


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

    const colorFilterElements = [
    { name: "White", letter: "W", icon: White },
    { name: "Blue", letter: "U", icon: Blue },
    { name: "Black", letter: "B", icon: Black },
    { name: "Red", letter: "R", icon: Red },
    { name: "Green", letter: "G", icon: Green },
    { name: "Colorless", letter: "C", icon: Colorless },
    { name: "Multicolor", letter: "M", icon: Multicolor },
    ];

  const TypeFilterElements = [
    { name: "Creature", icon: Creature },
    { name: "Instant", icon: Instant },
    { name: "Sorcery", icon: Sorcery },
    { name: "Enchantment", icon: Enchantment },
    { name: "Artifact", icon: Artifact },
    { name: "Battle", icon: Battle },
    { name: "Commander", icon: Commander },
    { name: "Planeswalker", icon: Planeswalker },
    { name: "Land", icon: Land },
  ];
  
  const rarityFilterElements = [
    { name: "common", icon: "" },
    { name: "uncommon", icon: "" },
    { name: "rare", icon: "" },
    { name: "mythic", icon: "" },
  ];

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
        {TypeFilterElements.map((type) => (
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
// Exports nommés — à privilégier (tree-shaking OK)
export {
  colorFilterElements,
  typeFilterElements,
  rarityFilterElements,
} from "@/lib/mtgIcons";

// (Optionnel) Export par défaut pour compat legacy.
import {
  colorFilterElements,
  typeFilterElements,
  rarityFilterElements,
} from "@/lib/mtgIcons";

const ActionBarConfig = {
  colorFilterElements,
  typeFilterElements,
  rarityFilterElements,
};

export default ActionBarConfig;
export const formatCard = (card) => {
  const layoutType = card.layout || "normal";

  const checkColorless = (card) => {
    return card.colors?.length === 0 && card.mana_cost ? ["C"] : card.colors;
  };

  const checkColorlessIdentity = (card) => {
    return (Array.isArray(card.color_identity) &&
      card.color_identity.length === 0 &&
      card.mana_cost &&
      card.mana_cost !== "")
      ? ["C"]
      : card.color_identity;
  };

  const formatText = (text) => text;

  // Base commune pour toutes les cartes
  const baseCard = {
    id: card.id || null,
    layout: layoutType,
    setCode: card.set || null,
    setName: card.set_name || null,
    lang: card.lang || "en",
    quantity: 1,
    addedAt: new Date().toISOString().split("T")[0],
    priceHistory: [
      {
        date: new Date().toISOString().split("T")[0],
        usd: card.prices?.usd || 0,
        eur: card.prices?.eur || 0,
      },
    ],
    rarity: card.rarity || null,
    collectorNumber: card.collector_number || null,
    artist: card.artist || null,
    legalities: card.legalities || {},
    colorIdentity: checkColorlessIdentity(card),
  };

  const extractImage = (face) => ({
    small: face?.image_uris?.small || null,
    normal: face?.image_uris?.normal || null,
    large: face?.image_uris?.large || null,
    artCrop: face?.image_uris?.art_crop || null,
  });

  // Cas spécial des cartes réversibles
  if (layoutType === "reversible_card") {
    const faceLayout = card.card_faces[0]?.layout || "normal";

    // Fonction interne pour gérer la face comme un layout connu
    const formatFaceAs = (layoutKind) => {
      switch (layoutKind) {
        case "adventure":
          return {
            ...baseCard,
            name: card.name.split(" // ")[0],
            type: card.card_faces[0].type_line,
            manaCost: card.card_faces[0].mana_cost,
            oracleText: card.card_faces[0].oracle_text || null,
            flavorText: card.card_faces[0].flavor_text || null,
            power: card.card_faces[0].power || null,
            toughness: card.card_faces[0].toughness || null,
            colors: checkColorless(card.card_faces[0]),
            image: extractImage(card.card_faces[0]),
            cardBack: {
              name: card.card_faces[1]?.name || card.name.split(" // ")[1],
              type: card.card_faces[1]?.type_line || null,
              manaCost: card.card_faces[1]?.mana_cost || null,
              oracleText: card.card_faces[1]?.oracle_text || null,
              flavorText: card.card_faces[1]?.flavor_text || null,
              power: card.card_faces[1]?.power || null,
              toughness: card.card_faces[1]?.toughness || null,
              colors: checkColorless(card.card_faces[1]),
            },
            reversibleImage: extractImage(card.card_faces[1]),
          };

        case "split":
        case "modal_dfc":
        case "transform":
        case "flip":
          return {
            ...baseCard,
            name: card.card_faces[0]?.name || card.name.split(" // ")[0],
            type: card.card_faces[0]?.type_line || card.type_line,
            manaCost: card.card_faces[0]?.mana_cost || card.mana_cost,
            oracleText: card.card_faces[0]?.oracle_text || card.oracle_text,
            flavorText: card.card_faces[0]?.flavor_text || card.flavor_text,
            loyalty: card.card_faces[0]?.loyalty || card.loyalty,
            power: card.card_faces[0]?.power || card.power,
            toughness: card.card_faces[0]?.toughness || card.toughness,
            colors: checkColorless(card.card_faces[0]),
            image: extractImage(card.card_faces[0]),
            cardBack: {
              name: card.card_faces[1]?.name || card.name.split(" // ")[1],
              type: card.card_faces[1]?.type_line || null,
              manaCost: card.card_faces[1]?.mana_cost || null,
              oracleText: card.card_faces[1]?.oracle_text || null,
              flavorText: card.card_faces[1]?.flavor_text || null,
              loyalty: card.card_faces[1]?.loyalty || null,
              power: card.card_faces[1]?.power || null,
              toughness: card.card_faces[1]?.toughness || null,
              colors: checkColorless(card.card_faces[1]),
              image: extractImage(card.card_faces[1]),
            },
            reversibleImage: extractImage(card.card_faces[1]),
          };

        default:
          return {
            ...baseCard,
            name: card.card_faces[0]?.name || card.name,
            type: card.card_faces[0]?.type_line || card.type_line,
            manaCost: card.card_faces[0]?.mana_cost || card.mana_cost,
            oracleText: card.card_faces[0]?.oracle_text || card.oracle_text,
            flavorText: card.card_faces[0]?.flavor_text || card.flavor_text,
            loyalty: card.card_faces[0]?.loyalty || card.loyalty,
            power: card.card_faces[0]?.power || card.power,
            toughness: card.card_faces[0]?.toughness || card.toughness,
            colors: checkColorless(card.card_faces[0]),
            image: extractImage(card.card_faces[0]),
            reversibleImage: extractImage(card.card_faces[1]),
          };
      }
    };

    return formatFaceAs(faceLayout);
  }

  // Layouts spéciaux classiques
  switch (layoutType) {
    case "transform":
    case "modal_dfc":
    case "flip":
      return {
        ...baseCard,
        name: card.card_faces[0]?.name || card.name.split(" // ")[0],
        type: card.card_faces[0]?.type_line || card.type_line,
        manaCost: card.card_faces[0]?.mana_cost || card.mana_cost,
        oracleText: card.card_faces[0]?.oracle_text || card.oracle_text,
        flavorText: card.card_faces[0]?.flavor_text || card.flavor_text,
        loyalty: card.card_faces[0]?.loyalty || card.loyalty,
        power: card.card_faces[0]?.power || card.power,
        toughness: card.card_faces[0]?.toughness || card.toughness,
        colors: checkColorless(card.card_faces[0]),
        image: extractImage(card.card_faces[0]),
        cardBack: {
          name: card.card_faces[1]?.name || card.name.split(" // ")[1],
          type: card.card_faces[1]?.type_line || null,
          manaCost: card.card_faces[1]?.mana_cost || null,
          oracleText: card.card_faces[1]?.oracle_text || null,
          flavorText: card.card_faces[1]?.flavor_text || null,
          loyalty: card.card_faces[1]?.loyalty || null,
          power: card.card_faces[1]?.power || null,
          toughness: card.card_faces[1]?.toughness || null,
          colors: checkColorless(card.card_faces[1]),
          image: extractImage(card.card_faces[1]),
        },
      };

    case "split":
    case "adventure":
      return {
        ...baseCard,
        name: card.name.split(" // ")[0],
        type: card.card_faces[0].type_line,
        manaCost: card.card_faces[0].mana_cost,
        oracleText: card.card_faces[0].oracle_text || null,
        flavorText: card.card_faces[0].flavor_text || null,
        power: card.power || null,
        toughness: card.toughness || null,
        colors: checkColorless(card),
        image: extractImage(card),
        cardBack: {
          name: card.card_faces[1]?.name || card.name.split(" // ")[1],
          type: card.card_faces[1]?.type_line,
          manaCost: card.card_faces[1]?.mana_cost,
          oracleText: card.card_faces[1]?.oracle_text || null,
          flavorText: card.card_faces[1]?.flavor_text || null,
          power: card.card_faces[1]?.power || null,
          toughness: card.card_faces[1]?.toughness || null,
          colors: checkColorless(card.card_faces[1]),
        },
      };

    default:
      return {
        ...baseCard,
        name: card.name || null,
        type: card.type_line || null,
        manaCost: card.mana_cost || null,
        oracleText: formatText(card.oracle_text) || null,
        flavorText: formatText(card.flavor_text) || null,
        power: card.power || null,
        toughness: card.toughness || null,
        loyalty: card.loyalty || null,
        colors: checkColorless(card),
        image: extractImage(card),
      };
  }
};

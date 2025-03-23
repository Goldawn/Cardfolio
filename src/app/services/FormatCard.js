export const formatCard = (card) => {
  const layoutType = card.layout || "normal";

  const checkColorless = (card) => {
    return card.colors?.length === 0 && card.mana_cost ? ["C"] : [];
  };

  const checkColorlessIdentity = (card) => {
    return (Array.isArray(card.color_identity) && card.color_identity.length === 0 && card.mana_cost && card.mana_cost !== "")
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
    addedAt: new Date().toISOString().split("T")[0], // Date d'ajout
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

  // Gestion des layouts spécifiques
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
        colors: card.card_faces[0]?.colors.length === 0 ? checkColorless(card.card_faces[0]) : card.card_faces[0]?.colors,
        image: {
          small: card.card_faces[0]?.image_uris?.small || card.image_uris?.small,
          normal: card.card_faces[0]?.image_uris?.normal || card.image_uris?.normal,
          large: card.card_faces[0]?.image_uris?.large || card.image_uris?.large,
        },
        cardBack: {
          name: card.card_faces[1]?.name || card.name.split(" // ")[1],
          type: card.card_faces[1]?.type_line,
          manaCost: card.card_faces[1]?.mana_cost,
          oracleText: card.card_faces[1]?.oracle_text,
          flavorText: card.card_faces[1]?.flavor_text,
          loyalty: card.card_faces[1]?.loyalty,
          power: card.card_faces[1]?.power,
          toughness: card.card_faces[1]?.toughness,
          colors: card.card_faces[1]?.colors.length === 0 ? checkColorless(card.card_faces[1]) : card.card_faces[1]?.colors,
          image: {
            small: card.card_faces[1]?.image_uris?.small,
            normal: card.card_faces[1]?.image_uris?.normal,
            large: card.card_faces[1]?.image_uris?.large,
          },
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
        power: card.power,
        toughness: card.toughness,
        colors: card.colors.length === 0 ? checkColorless(card) : card.colors,
        image: {
          small: card.image_uris?.small || null,
          normal: card.image_uris?.normal || null,
          large: card.image_uris?.large || null,
        },
        cardBack: {
          name: card.card_faces[1]?.name || card.name.split(" // ")[1],
          type: card.card_faces[1]?.type_line,
          manaCost: card.card_faces[1]?.mana_cost,
          oracleText: card.card_faces[1]?.oracle_text || null,
          flavorText: card.card_faces[1]?.flavor_text || null,
          power: card.card_faces[1]?.power || null,
          toughness: card.card_faces[1]?.toughness || null,
          colors: card.card_faces[1]?.colors?.length === 0 ? checkColorless(card.card_faces[1]) : card.card_faces[1]?.colors,
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
        colors: card.colors.length === 0 ? checkColorless(card) : card.colors,
        image: {
          small: card.image_uris?.small || null,
          normal: card.image_uris?.normal || null,
          large: card.image_uris?.large || null,
        },
      };
  }
};




// Layout transform Avacyn Example :

// {
//   "object": "card",
//   "id": "fe675f03-cbb5-4177-b7d7-64a30260ee2a",
//   "oracle_id": "432b37a5-d32a-4b78-91ab-860aa026b7cc",
//   "multiverse_ids": [
//       685826
//   ],
//   "mtgo_id": 135378,
//   "tcgplayer_id": 600427,
//   "cardmarket_id": 802795,
//   "name": "Archangel Avacyn // Avacyn, the Purifier",
//   "lang": "en",
//   "released_at": "2025-01-24",
//   "uri": "https://api.scryfall.com/cards/fe675f03-cbb5-4177-b7d7-64a30260ee2a",
//   "scryfall_uri": "https://scryfall.com/card/inr/11/archangel-avacyn-avacyn-the-purifier?utm_source=api",
//   "layout": "transform",
//   "highres_image": true,
//   "image_status": "highres_scan",
//   "cmc": 5,
//   "type_line": "Legendary Creature — Angel // Legendary Creature — Angel",
//   "color_identity": [
//       "R",
//       "W"
//   ],
//   "keywords": [
//       "Flying",
//       "Vigilance",
//       "Transform",
//       "Flash"
//   ],
//   "card_faces": [
//       {
//           "object": "card_face",
//           "name": "Archangel Avacyn",
//           "mana_cost": "{3}{W}{W}",
//           "type_line": "Legendary Creature — Angel",
//           "oracle_text": "Flash\nFlying, vigilance\nWhen Archangel Avacyn enters, creatures you control gain indestructible until end of turn.\nWhen a non-Angel creature you control dies, transform Archangel Avacyn at the beginning of the next upkeep.",
//           "colors": [
//               "W"
//           ],
//           "power": "4",
//           "toughness": "4",
//           "artist": "James Ryman",
//           "artist_id": "3852bbc9-11c0-4fe3-8722-a06ad7e2bcc5",
//           "illustration_id": "f90dd248-e671-4055-8031-c0f9938132ee",
//           "image_uris": {
//               "small": "https://cards.scryfall.io/small/front/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "normal": "https://cards.scryfall.io/normal/front/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "large": "https://cards.scryfall.io/large/front/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "png": "https://cards.scryfall.io/png/front/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.png?1736467464",
//               "art_crop": "https://cards.scryfall.io/art_crop/front/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "border_crop": "https://cards.scryfall.io/border_crop/front/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464"
//           }
//       },
//       {
//           "object": "card_face",
//           "name": "Avacyn, the Purifier",
//           "mana_cost": "",
//           "type_line": "Legendary Creature — Angel",
//           "oracle_text": "Flying\nWhen this creature transforms into Avacyn, the Purifier, it deals 3 damage to each other creature and each opponent.",
//           "colors": [
//               "R"
//           ],
//           "color_indicator": [
//               "R"
//           ],
//           "power": "6",
//           "toughness": "5",
//           "flavor_text": "\"Wings that once bore hope are now stained with blood. She is our guardian no longer.\"\n—Grete, cathar apostate",
//           "artist": "James Ryman",
//           "artist_id": "3852bbc9-11c0-4fe3-8722-a06ad7e2bcc5",
//           "illustration_id": "7c028c56-e6d0-4ce9-aea9-994ba128245f",
//           "image_uris": {
//               "small": "https://cards.scryfall.io/small/back/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "normal": "https://cards.scryfall.io/normal/back/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "large": "https://cards.scryfall.io/large/back/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "png": "https://cards.scryfall.io/png/back/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.png?1736467464",
//               "art_crop": "https://cards.scryfall.io/art_crop/back/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464",
//               "border_crop": "https://cards.scryfall.io/border_crop/back/f/e/fe675f03-cbb5-4177-b7d7-64a30260ee2a.jpg?1736467464"
//           }
//       }
//   ],
//   "all_parts": [
//       {
//           "object": "related_card",
//           "id": "df325e2d-869d-49f1-bec2-630694d5ea7a",
//           "component": "combo_piece",
//           "name": "Archangel Avacyn // Avacyn, the Purifier",
//           "type_line": "Legendary Creature — Angel // Legendary Creature — Angel",
//           "uri": "https://api.scryfall.com/cards/df325e2d-869d-49f1-bec2-630694d5ea7a"
//       },
//       {
//           "object": "related_card",
//           "id": "4825c59d-9e27-4a12-ba84-642b8540e573",
//           "component": "combo_piece",
//           "name": "Shadows Over Innistrad Checklist 2",
//           "type_line": "Card",
//           "uri": "https://api.scryfall.com/cards/4825c59d-9e27-4a12-ba84-642b8540e573"
//       }
//   ],
//   "legalities": {
//       "standard": "not_legal",
//       "future": "not_legal",
//       "historic": "legal",
//       "timeless": "legal",
//       "gladiator": "legal",
//       "pioneer": "legal",
//       "explorer": "legal",
//       "modern": "legal",
//       "legacy": "legal",
//       "pauper": "not_legal",
//       "vintage": "legal",
//       "penny": "legal",
//       "commander": "legal",
//       "oathbreaker": "legal",
//       "standardbrawl": "not_legal",
//       "brawl": "legal",
//       "alchemy": "not_legal",
//       "paupercommander": "not_legal",
//       "duel": "legal",
//       "oldschool": "not_legal",
//       "premodern": "not_legal",
//       "predh": "not_legal"
//   },
//   "games": [
//       "paper"
//   ],
//   "reserved": false,
//   "game_changer": false,
//   "foil": true,
//   "nonfoil": true,
//   "finishes": [
//       "nonfoil",
//       "foil"
//   ],
//   "oversized": false,
//   "promo": false,
//   "reprint": true,
//   "variation": false,
//   "set_id": "b9618c8c-9f31-4b42-9798-2991893c27bf",
//   "set": "inr",
//   "set_name": "Innistrad Remastered",
//   "set_type": "masters",
//   "set_uri": "https://api.scryfall.com/sets/b9618c8c-9f31-4b42-9798-2991893c27bf",
//   "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Ainr&unique=prints",
//   "scryfall_set_uri": "https://scryfall.com/sets/inr?utm_source=api",
//   "rulings_uri": "https://api.scryfall.com/cards/fe675f03-cbb5-4177-b7d7-64a30260ee2a/rulings",
//   "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3A432b37a5-d32a-4b78-91ab-860aa026b7cc&unique=prints",
//   "collector_number": "11",
//   "digital": false,
//   "rarity": "mythic",
//   "artist": "James Ryman",
//   "artist_ids": [
//       "3852bbc9-11c0-4fe3-8722-a06ad7e2bcc5"
//   ],
//   "border_color": "black",
//   "frame": "2015",
//   "frame_effects": [
//       "legendary"
//   ],
//   "security_stamp": "oval",
//   "full_art": false,
//   "textless": false,
//   "booster": true,
//   "story_spotlight": false,
//   "edhrec_rank": 7050,
//   "penny_rank": 2145,
//   "preview": {
//       "source": "Wizards of the Coast",
//       "source_uri": "",
//       "previewed_at": "2024-12-03"
//   },
//   "prices": {
//       "usd": "1.84",
//       "usd_foil": "2.04",
//       "usd_etched": null,
//       "eur": "1.44",
//       "eur_foil": "2.17",
//       "tix": null
//   },
//   "related_uris": {
//       "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=685826&printed=false",
//       "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DArchangel%2BAvacyn%2B%252F%252F%2BAvacyn%252C%2Bthe%2BPurifier",
//       "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DArchangel%2BAvacyn%2B%252F%252F%2BAvacyn%252C%2Bthe%2BPurifier",
//       "edhrec": "https://edhrec.com/route/?cc=Archangel+Avacyn"
//   },
//   "purchase_uris": {
//       "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F600427%3Fpage%3D1",
//       "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/Innistrad-Remastered/Archangel-Avacyn-Avacyn-the-Purifier?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
//       "cardhoarder": "https://www.cardhoarder.com/cards/135378?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
//   }
// }












// Wilds of Eldraine Bi-card Example : 

// {
//   "object": "card",
//   "id": "5980a930-c7f8-45e1-a18a-87734d9ed09e",
//   "oracle_id": "c7b6d2cd-9105-404b-88f0-a67037fb2120",
//   "multiverse_ids": [
//       629505
//   ],
//   "mtgo_id": 116296,
//   "arena_id": 86686,
//   "tcgplayer_id": 512163,
//   "cardmarket_id": 728013,
//   "name": "Besotted Knight // Betroth the Beast",
//   "lang": "en",
//   "released_at": "2023-09-08",
//   "uri": "https://api.scryfall.com/cards/5980a930-c7f8-45e1-a18a-87734d9ed09e",
//   "scryfall_uri": "https://scryfall.com/card/woe/4/besotted-knight-betroth-the-beast?utm_source=api",
//   "layout": "adventure",
//   "highres_image": true,
//   "image_status": "highres_scan",
//   "image_uris": {
//       "small": "https://cards.scryfall.io/small/front/5/9/5980a930-c7f8-45e1-a18a-87734d9ed09e.jpg?1708138623",
//       "normal": "https://cards.scryfall.io/normal/front/5/9/5980a930-c7f8-45e1-a18a-87734d9ed09e.jpg?1708138623",
//       "large": "https://cards.scryfall.io/large/front/5/9/5980a930-c7f8-45e1-a18a-87734d9ed09e.jpg?1708138623"
//   },
//   "mana_cost": "{3}{W} // {W}",
//   "cmc": 4,
//   "type_line": "Creature — Human Knight // Sorcery — Adventure",
//   "power": "3",
//   "toughness": "3",
//   "colors": [
//       "W"
//   ],
//   "color_identity": [
//       "W"
//   ],
//   "keywords": [
//       "Role token"
//   ],
//   "card_faces": [
//       {
//           "object": "card_face",
//           "name": "Besotted Knight",
//           "mana_cost": "{3}{W}",
//           "type_line": "Creature — Human Knight",
//           "oracle_text": "",
//           "power": "3",
//           "toughness": "3",
//           "flavor_text": "\"You are no monster to me, my love.\"",
//           "artist": "Andreia Ugrai",
//           "artist_id": "f72c1593-751b-45a4-ba65-205509b81b93",
//           "illustration_id": "47077ec2-2d7d-4d9d-8471-f69b549c7069"
//       },
//       {
//           "object": "card_face",
//           "name": "Betroth the Beast",
//           "mana_cost": "{W}",
//           "type_line": "Sorcery — Adventure",
//           "oracle_text": "Create a Royal Role token attached to target creature you control. (Enchanted creature gets +1/+1 and has ward {1}.)",
//           "artist": "Andreia Ugrai",
//           "artist_id": "f72c1593-751b-45a4-ba65-205509b81b93"
//       }
//   ],
//   "all_parts": [
//       {
//           "object": "related_card",
//           "id": "cff8ef48-2988-4d21-837e-01f1459e07c5",
//           "component": "token",
//           "name": "Royal // Young Hero",
//           "type_line": "Token Enchantment — Aura Role // Token Enchantment — Aura Role",
//           "uri": "https://api.scryfall.com/cards/cff8ef48-2988-4d21-837e-01f1459e07c5"
//       },
//       {
//           "object": "related_card",
//           "id": "fcf4c7fb-7859-4c11-8552-6817f5119d2e",
//           "component": "combo_piece",
//           "name": "On an Adventure",
//           "type_line": "Card",
//           "uri": "https://api.scryfall.com/cards/fcf4c7fb-7859-4c11-8552-6817f5119d2e"
//       },
//       {
//           "object": "related_card",
//           "id": "5980a930-c7f8-45e1-a18a-87734d9ed09e",
//           "component": "combo_piece",
//           "name": "Besotted Knight // Betroth the Beast",
//           "type_line": "Creature — Human Knight // Sorcery — Adventure",
//           "uri": "https://api.scryfall.com/cards/5980a930-c7f8-45e1-a18a-87734d9ed09e"
//       }
//   ],
//   "legalities": {
//       "standard": "legal",
//       "future": "legal",
//       "historic": "legal",
//       "timeless": "legal",
//       "gladiator": "legal",
//       "pioneer": "legal",
//       "explorer": "legal",
//       "modern": "legal",
//       "legacy": "legal",
//       "pauper": "legal",
//       "vintage": "legal",
//       "penny": "not_legal",
//       "commander": "legal",
//       "oathbreaker": "legal",
//       "standardbrawl": "legal",
//       "brawl": "legal",
//       "alchemy": "legal",
//       "paupercommander": "legal",
//       "duel": "legal",
//       "oldschool": "not_legal",
//       "premodern": "not_legal",
//       "predh": "not_legal"
//   },
//   "games": [
//       "paper",
//       "arena",
//       "mtgo"
//   ],
//   "reserved": false,
//   "game_changer": false,
//   "foil": true,
//   "nonfoil": true,
//   "finishes": [
//       "nonfoil",
//       "foil"
//   ],
//   "oversized": false,
//   "promo": false,
//   "reprint": false,
//   "variation": false,
//   "set_id": "79139661-13ee-43c4-8bad-a8c069f1a1df",
//   "set": "woe",
//   "set_name": "Wilds of Eldraine",
//   "set_type": "expansion",
//   "set_uri": "https://api.scryfall.com/sets/79139661-13ee-43c4-8bad-a8c069f1a1df",
//   "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Awoe&unique=prints",
//   "scryfall_set_uri": "https://scryfall.com/sets/woe?utm_source=api",
//   "rulings_uri": "https://api.scryfall.com/cards/5980a930-c7f8-45e1-a18a-87734d9ed09e/rulings",
//   "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Ac7b6d2cd-9105-404b-88f0-a67037fb2120&unique=prints",
//   "collector_number": "4",
//   "digital": false,
//   "rarity": "common",
//   "flavor_text": "\"You are no monster to me, my love.\"",
//   "card_back_id": "0aeebaf5-8c7d-4636-9e82-8c27447861f7",
//   "artist": "Andreia Ugrai",
//   "artist_ids": [
//       "f72c1593-751b-45a4-ba65-205509b81b93"
//   ],
//   "illustration_id": "47077ec2-2d7d-4d9d-8471-f69b549c7069",
//   "border_color": "black",
//   "frame": "2015",
//   "full_art": false,
//   "textless": false,
//   "booster": true,
//   "story_spotlight": false,
//   "edhrec_rank": 15206,
//   "penny_rank": 8359,
//   "preview": {
//       "source": "Wizards of the Coast",
//       "source_uri": "https://magic.wizards.com/en/products/wilds-of-eldraine/card-image-gallery",
//       "previewed_at": "2023-08-15"
//   },
//   "prices": {
//       "usd": "0.04",
//       "usd_foil": "0.06",
//       "usd_etched": null,
//       "eur": "0.02",
//       "eur_foil": "0.10",
//       "tix": "0.03"
//   },
//   "related_uris": {
//       "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=629505&printed=false",
//       "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DBesotted%2BKnight%2B%252F%252F%2BBetroth%2Bthe%2BBeast",
//       "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DBesotted%2BKnight%2B%252F%252F%2BBetroth%2Bthe%2BBeast",
//       "edhrec": "https://edhrec.com/route/?cc=Besotted+Knight"
//   },
//   "purchase_uris": {
//       "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F512163%3Fpage%3D1",
//       "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/Wilds-of-Eldraine/Besotted-Knight-Betroth-the-Beast?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
//       "cardhoarder": "https://www.cardhoarder.com/cards/116296?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
//   }
// }













// Manoir Karlov Bi card Example :

// {
//   "object": "card",
//   "id": "cb59130a-a134-4383-b983-e4b526d11fb4",
//   "oracle_id": "ba4d644f-1931-4fc4-aed5-681a476a5a58",
//   "multiverse_ids": [
//       646800
//   ],
//   "mtgo_id": 121964,
//   "arena_id": 89158,
//   "tcgplayer_id": 534189,
//   "cardmarket_id": 752002,
//   "name": "Cease // Desist",
//   "lang": "en",
//   "released_at": "2024-02-09",
//   "uri": "https://api.scryfall.com/cards/cb59130a-a134-4383-b983-e4b526d11fb4",
//   "scryfall_uri": "https://scryfall.com/card/mkm/246/cease-desist?utm_source=api",
//   "layout": "split",
//   "highres_image": true,
//   "image_status": "highres_scan",
//   "image_uris": {
//       "small": "https://cards.scryfall.io/small/front/c/b/cb59130a-a134-4383-b983-e4b526d11fb4.jpg?1706242296",
//       "normal": "https://cards.scryfall.io/normal/front/c/b/cb59130a-a134-4383-b983-e4b526d11fb4.jpg?1706242296",
//       "large": "https://cards.scryfall.io/large/front/c/b/cb59130a-a134-4383-b983-e4b526d11fb4.jpg?1706242296"
//   },
//   "mana_cost": "{1}{B/G} // {4}{G/W}{G/W}",
//   "cmc": 8,
//   "type_line": "Instant // Sorcery",
//   "colors": [
//       "B",
//       "G",
//       "W"
//   ],
//   "color_identity": [
//       "B",
//       "G",
//       "W"
//   ],
//   "keywords": [],
//   "card_faces": [
//       {
//           "object": "card_face",
//           "name": "Cease",
//           "mana_cost": "{1}{B/G}",
//           "type_line": "Instant",
//           "oracle_text": "Exile up to two target cards from a single graveyard. Target player gains 2 life and draws a card.",
//           "artist": "Dominik Mayer",
//           "artist_id": "c3439c4a-1fee-4e33-9b89-18dac27ac927",
//           "illustration_id": "b47c9469-3e8c-4b08-a7a2-e9c2524db252"
//       },
//       {
//           "object": "card_face",
//           "name": "Desist",
//           "mana_cost": "{4}{G/W}{G/W}",
//           "type_line": "Sorcery",
//           "oracle_text": "Destroy all artifacts and enchantments.",
//           "artist": "Dominik Mayer",
//           "artist_id": "c3439c4a-1fee-4e33-9b89-18dac27ac927"
//       }
//   ],
//   "legalities": {
//       "standard": "legal",
//       "future": "legal",
//       "historic": "legal",
//       "timeless": "legal",
//       "gladiator": "legal",
//       "pioneer": "legal",
//       "explorer": "legal",
//       "modern": "legal",
//       "legacy": "legal",
//       "pauper": "not_legal",
//       "vintage": "legal",
//       "penny": "not_legal",
//       "commander": "legal",
//       "oathbreaker": "legal",
//       "standardbrawl": "legal",
//       "brawl": "legal",
//       "alchemy": "legal",
//       "paupercommander": "not_legal",
//       "duel": "legal",
//       "oldschool": "not_legal",
//       "premodern": "not_legal",
//       "predh": "not_legal"
//   },
//   "games": [
//       "paper",
//       "mtgo",
//       "arena"
//   ],
//   "reserved": false,
//   "game_changer": false,
//   "foil": true,
//   "nonfoil": true,
//   "finishes": [
//       "nonfoil",
//       "foil"
//   ],
//   "oversized": false,
//   "promo": false,
//   "reprint": false,
//   "variation": false,
//   "set_id": "2b17794b-15c3-4796-ad6f-0887a0eceeca",
//   "set": "mkm",
//   "set_name": "Murders at Karlov Manor",
//   "set_type": "expansion",
//   "set_uri": "https://api.scryfall.com/sets/2b17794b-15c3-4796-ad6f-0887a0eceeca",
//   "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Amkm&unique=prints",
//   "scryfall_set_uri": "https://scryfall.com/sets/mkm?utm_source=api",
//   "rulings_uri": "https://api.scryfall.com/cards/cb59130a-a134-4383-b983-e4b526d11fb4/rulings",
//   "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Aba4d644f-1931-4fc4-aed5-681a476a5a58&unique=prints",
//   "collector_number": "246",
//   "digital": false,
//   "rarity": "uncommon",
//   "card_back_id": "0aeebaf5-8c7d-4636-9e82-8c27447861f7",
//   "artist": "Dominik Mayer",
//   "artist_ids": [
//       "c3439c4a-1fee-4e33-9b89-18dac27ac927"
//   ],
//   "illustration_id": "b47c9469-3e8c-4b08-a7a2-e9c2524db252",
//   "border_color": "black",
//   "frame": "2015",
//   "full_art": false,
//   "textless": false,
//   "booster": true,
//   "story_spotlight": false,
//   "edhrec_rank": 21453,
//   "penny_rank": 1661,
//   "preview": {
//       "source": "anzidmtg",
//       "source_uri": "https://www.twitch.tv/videos/2039613268",
//       "previewed_at": "2024-01-21"
//   },
//   "prices": {
//       "usd": "0.11",
//       "usd_foil": "0.12",
//       "usd_etched": null,
//       "eur": "0.16",
//       "eur_foil": "0.30",
//       "tix": "0.03"
//   },
//   "related_uris": {
//       "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=646800&printed=false",
//       "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DCease%2B%252F%252F%2BDesist",
//       "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DCease%2B%252F%252F%2BDesist",
//       "edhrec": "https://edhrec.com/route/?cc=Cease+%2F%2F+Desist"
//   },
//   "purchase_uris": {
//       "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F534189%3Fpage%3D1",
//       "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/Murders-at-Karlov-Manor/Cease-Desist?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
//       "cardhoarder": "https://www.cardhoarder.com/cards/121964?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
//   }
// }








// ROOM duskmourn

// {
//   "object": "card",
//   "id": "8e2fae80-60af-44cf-95b4-177837435d1a",
//   "oracle_id": "c46a02db-13d6-477f-9da0-822599470168",
//   "multiverse_ids": [
//       673408
//   ],
//   "mtgo_id": 130137,
//   "arena_id": 92057,
//   "tcgplayer_id": 579140,
//   "cardmarket_id": 788414,
//   "name": "Dazzling Theater // Prop Room",
//   "lang": "en",
//   "released_at": "2024-09-27",
//   "uri": "https://api.scryfall.com/cards/8e2fae80-60af-44cf-95b4-177837435d1a",
//   "scryfall_uri": "https://scryfall.com/card/dsk/3/dazzling-theater-prop-room?utm_source=api",
//   "layout": "split",
//   "highres_image": true,
//   "image_status": "highres_scan",
//   "image_uris": {
//       "small": "https://cards.scryfall.io/small/front/8/e/8e2fae80-60af-44cf-95b4-177837435d1a.jpg?1726867087",
//       "normal": "https://cards.scryfall.io/normal/front/8/e/8e2fae80-60af-44cf-95b4-177837435d1a.jpg?1726867087",
//       "large": "https://cards.scryfall.io/large/front/8/e/8e2fae80-60af-44cf-95b4-177837435d1a.jpg?1726867087"
//   },
//   "mana_cost": "{3}{W} // {2}{W}",
//   "cmc": 7,
//   "type_line": "Enchantment — Room // Enchantment — Room",
//   "colors": [
//       "W"
//   ],
//   "color_identity": [
//       "W"
//   ],
//   "keywords": [],
//   "card_faces": [
//       {
//           "object": "card_face",
//           "name": "Dazzling Theater",
//           "mana_cost": "{3}{W}",
//           "type_line": "Enchantment — Room",
//           "oracle_text": "Creature spells you cast have convoke. (Your creatures can help cast those spells. Each creature you tap while casting a creature spell pays for {1} or one mana of that creature's color.)\n(You may cast either half. That door unlocks on the battlefield. As a sorcery, you may pay the mana cost of a locked door to unlock it.)",
//           "artist": "Henry Peters",
//           "artist_id": "2ffd9e06-94af-44f5-bec6-06f781941a6c",
//           "illustration_id": "1026f36f-26c0-4b44-9385-b9344cfd664a"
//       },
//       {
//           "object": "card_face",
//           "name": "Prop Room",
//           "mana_cost": "{2}{W}",
//           "type_line": "Enchantment — Room",
//           "oracle_text": "Untap each creature you control during each other player's untap step.\n(You may cast either half. That door unlocks on the battlefield. As a sorcery, you may pay the mana cost of a locked door to unlock it.)",
//           "artist": "Henry Peters",
//           "artist_id": "2ffd9e06-94af-44f5-bec6-06f781941a6c"
//       }
//   ],
//   "legalities": {
//       "standard": "legal",
//       "future": "legal",
//       "historic": "legal",
//       "timeless": "legal",
//       "gladiator": "legal",
//       "pioneer": "legal",
//       "explorer": "legal",
//       "modern": "legal",
//       "legacy": "legal",
//       "pauper": "not_legal",
//       "vintage": "legal",
//       "penny": "legal",
//       "commander": "legal",
//       "oathbreaker": "legal",
//       "standardbrawl": "legal",
//       "brawl": "legal",
//       "alchemy": "legal",
//       "paupercommander": "not_legal",
//       "duel": "legal",
//       "oldschool": "not_legal",
//       "premodern": "not_legal",
//       "predh": "not_legal"
//   },
//   "games": [
//       "paper",
//       "mtgo",
//       "arena"
//   ],
//   "reserved": false,
//   "game_changer": false,
//   "foil": true,
//   "nonfoil": true,
//   "finishes": [
//       "nonfoil",
//       "foil"
//   ],
//   "oversized": false,
//   "promo": false,
//   "reprint": false,
//   "variation": false,
//   "set_id": "a111d8a9-b647-48ec-afab-2b78f92173f5",
//   "set": "dsk",
//   "set_name": "Duskmourn: House of Horror",
//   "set_type": "expansion",
//   "set_uri": "https://api.scryfall.com/sets/a111d8a9-b647-48ec-afab-2b78f92173f5",
//   "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Adsk&unique=prints",
//   "scryfall_set_uri": "https://scryfall.com/sets/dsk?utm_source=api",
//   "rulings_uri": "https://api.scryfall.com/cards/8e2fae80-60af-44cf-95b4-177837435d1a/rulings",
//   "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3Ac46a02db-13d6-477f-9da0-822599470168&unique=prints",
//   "collector_number": "3",
//   "digital": false,
//   "rarity": "rare",
//   "card_back_id": "0aeebaf5-8c7d-4636-9e82-8c27447861f7",
//   "artist": "Henry Peters",
//   "artist_ids": [
//       "2ffd9e06-94af-44f5-bec6-06f781941a6c"
//   ],
//   "illustration_id": "1026f36f-26c0-4b44-9385-b9344cfd664a",
//   "border_color": "black",
//   "frame": "2015",
//   "security_stamp": "oval",
//   "full_art": false,
//   "textless": false,
//   "booster": true,
//   "story_spotlight": false,
//   "edhrec_rank": 2321,
//   "prices": {
//       "usd": "0.94",
//       "usd_foil": "1.71",
//       "usd_etched": null,
//       "eur": "0.83",
//       "eur_foil": "0.83",
//       "tix": "0.02"
//   },
//   "related_uris": {
//       "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=673408&printed=false",
//       "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DDazzling%2BTheater%2B%252F%252F%2BProp%2BRoom",
//       "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DDazzling%2BTheater%2B%252F%252F%2BProp%2BRoom",
//       "edhrec": "https://edhrec.com/route/?cc=Dazzling+Theater+%2F%2F+Prop+Room"
//   },
//   "purchase_uris": {
//       "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F579140%3Fpage%3D1",
//       "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/Duskmourn-House-of-Horror/Dazzling-Theater-Prop-Room?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
//       "cardhoarder": "https://www.cardhoarder.com/cards/130137?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
//   }
// }



// MARCH of the Machine --- Invasion

// {
//   "object": "card",
//   "id": "73f8fc4f-2f36-4932-8d04-3c2651c116dc",
//   "oracle_id": "78da7a38-0f08-4371-bda3-38f079f7724d",
//   "multiverse_ids": [
//       607011,
//       607012
//   ],
//   "mtgo_id": 109794,
//   "arena_id": 84247,
//   "tcgplayer_id": 490433,
//   "cardmarket_id": 703461,
//   "name": "Invasion of Ravnica // Guildpact Paragon",
//   "lang": "en",
//   "released_at": "2023-04-21",
//   "uri": "https://api.scryfall.com/cards/73f8fc4f-2f36-4932-8d04-3c2651c116dc",
//   "scryfall_uri": "https://scryfall.com/card/mom/1/invasion-of-ravnica-guildpact-paragon?utm_source=api",
//   "layout": "transform",
//   "highres_image": true,
//   "image_status": "highres_scan",
//   "cmc": 5,
//   "type_line": "Battle — Siege // Artifact Creature — Construct",
//   "color_identity": [],
//   "keywords": [
//       "Transform"
//   ],
//   "card_faces": [
//       {
//           "object": "card_face",
//           "name": "Invasion of Ravnica",
//           "mana_cost": "{5}",
//           "type_line": "Battle — Siege",
//           "oracle_text": "(As a Siege enters, choose an opponent to protect it. You and others can attack it. When it's defeated, exile it, then cast it transformed.)\nWhen this Siege enters, exile target nonland permanent an opponent controls that isn't exactly two colors.",
//           "colors": [],
//           "defense": "4",
//           "artist": "Leon Tukker",
//           "artist_id": "669b8b90-758d-4f9e-b4f7-98cd6742eb97",
//           "illustration_id": "a3c935cf-7d12-4548-a38b-1aad2887d140",
//           "image_uris": {
//               "small": "https://cards.scryfall.io/small/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "normal": "https://cards.scryfall.io/normal/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "large": "https://cards.scryfall.io/large/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "png": "https://cards.scryfall.io/png/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.png?1682704897",
//               "art_crop": "https://cards.scryfall.io/art_crop/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "border_crop": "https://cards.scryfall.io/border_crop/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897"
//           }
//       },
//       {
//           "object": "card_face",
//           "name": "Guildpact Paragon",
//           "mana_cost": "",
//           "type_line": "Artifact Creature — Construct",
//           "oracle_text": "Whenever you cast a spell that's exactly two colors, look at the top six cards of your library. You may reveal a card that's exactly two colors from among them and put it into your hand. Put the rest on the bottom of your library in a random order.",
//           "colors": [],
//           "power": "5",
//           "toughness": "5",
//           "artist": "Leon Tukker",
//           "artist_id": "669b8b90-758d-4f9e-b4f7-98cd6742eb97",
//           "illustration_id": "fd029fea-0715-4c57-9c44-784eec1699bf",
//           "image_uris": {
//               "small": "https://cards.scryfall.io/small/back/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "normal": "https://cards.scryfall.io/normal/back/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "large": "https://cards.scryfall.io/large/back/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "png": "https://cards.scryfall.io/png/back/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.png?1682704897",
//               "art_crop": "https://cards.scryfall.io/art_crop/back/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//               "border_crop": "https://cards.scryfall.io/border_crop/back/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897"
//           }
//       }
//   ],
//   "legalities": {
//       "standard": "legal",
//       "future": "legal",
//       "historic": "legal",
//       "timeless": "legal",
//       "gladiator": "legal",
//       "pioneer": "legal",
//       "explorer": "legal",
//       "modern": "legal",
//       "legacy": "legal",
//       "pauper": "not_legal",
//       "vintage": "legal",
//       "penny": "not_legal",
//       "commander": "legal",
//       "oathbreaker": "legal",
//       "standardbrawl": "legal",
//       "brawl": "legal",
//       "alchemy": "not_legal",
//       "paupercommander": "not_legal",
//       "duel": "legal",
//       "oldschool": "not_legal",
//       "premodern": "not_legal",
//       "predh": "not_legal"
//   },
//   "games": [
//       "paper",
//       "mtgo",
//       "arena"
//   ],
//   "reserved": false,
//   "game_changer": false,
//   "foil": true,
//   "nonfoil": true,
//   "finishes": [
//       "nonfoil",
//       "foil"
//   ],
//   "oversized": false,
//   "promo": false,
//   "reprint": false,
//   "variation": false,
//   "set_id": "392f7315-dc53-40a3-a2cc-5482dbd498b3",
//   "set": "mom",
//   "set_name": "March of the Machine",
//   "set_type": "expansion",
//   "set_uri": "https://api.scryfall.com/sets/392f7315-dc53-40a3-a2cc-5482dbd498b3",
//   "set_search_uri": "https://api.scryfall.com/cards/search?order=set&q=e%3Amom&unique=prints",
//   "scryfall_set_uri": "https://scryfall.com/sets/mom?utm_source=api",
//   "rulings_uri": "https://api.scryfall.com/cards/73f8fc4f-2f36-4932-8d04-3c2651c116dc/rulings",
//   "prints_search_uri": "https://api.scryfall.com/cards/search?order=released&q=oracleid%3A78da7a38-0f08-4371-bda3-38f079f7724d&unique=prints",
//   "collector_number": "1",
//   "digital": false,
//   "rarity": "mythic",
//   "artist": "Leon Tukker",
//   "artist_ids": [
//       "669b8b90-758d-4f9e-b4f7-98cd6742eb97"
//   ],
//   "border_color": "black",
//   "frame": "2015",
//   "security_stamp": "oval",
//   "full_art": false,
//   "textless": false,
//   "booster": true,
//   "story_spotlight": false,
//   "edhrec_rank": 10107,
//   "prices": {
//       "usd": "0.31",
//       "usd_foil": "0.83",
//       "usd_etched": null,
//       "eur": "0.68",
//       "eur_foil": "0.90",
//       "tix": "0.07"
//   },
//   "related_uris": {
//       "gatherer": "https://gatherer.wizards.com/Pages/Card/Details.aspx?multiverseid=607011&printed=false",
//       "tcgplayer_infinite_articles": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Darticle%26game%3Dmagic%26q%3DInvasion%2Bof%2BRavnica%2B%252F%252F%2BGuildpact%2BParagon",
//       "tcgplayer_infinite_decks": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&trafcat=infinite&u=https%3A%2F%2Finfinite.tcgplayer.com%2Fsearch%3FcontentMode%3Ddeck%26game%3Dmagic%26q%3DInvasion%2Bof%2BRavnica%2B%252F%252F%2BGuildpact%2BParagon",
//       "edhrec": "https://edhrec.com/route/?cc=Invasion+of+Ravnica"
//   },
//   "purchase_uris": {
//       "tcgplayer": "https://partner.tcgplayer.com/c/4931599/1830156/21018?subId1=api&u=https%3A%2F%2Fwww.tcgplayer.com%2Fproduct%2F490433%3Fpage%3D1",
//       "cardmarket": "https://www.cardmarket.com/en/Magic/Products/Singles/March-of-the-Machine/Invasion-of-Ravnica-Guildpact-Paragon?referrer=scryfall&utm_campaign=card_prices&utm_medium=text&utm_source=scryfall",
//       "cardhoarder": "https://www.cardhoarder.com/cards/109794?affiliate_id=scryfall&ref=card-profile&utm_campaign=affiliate&utm_medium=card&utm_source=scryfall"
//   },
//   "image_uris": {
//       "small": "https://cards.scryfall.io/small/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//       "normal": "https://cards.scryfall.io/normal/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897",
//       "large": "https://cards.scryfall.io/large/front/7/3/73f8fc4f-2f36-4932-8d04-3c2651c116dc.jpg?1682704897"
//   }
// }

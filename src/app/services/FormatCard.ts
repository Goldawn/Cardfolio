import type { MTGCard, MTGGameData, MTGCardFace, MTGColor } from '@/types/games/magic'
import type { CardImages, CardRarity } from '@/types/base'

interface ScryfallCard {
  id: string
  name: string
  layout?: string
  set: string
  set_name: string
  lang?: string
  prices?: {
    usd: string | null
    eur: string | null
  }
  rarity?: string
  collector_number?: string
  artist?: string
  legalities?: Record<string, string>
  colors?: string[]
  color_identity?: string[]
  mana_cost?: string
  type_line?: string
  oracle_text?: string
  flavor_text?: string
  power?: string
  toughness?: string
  loyalty?: string
  card_faces?: ScryfallCardFace[]
  image_uris?: CardImages
}

interface ScryfallCardFace {
  name?: string
  mana_cost?: string
  type_line?: string
  oracle_text?: string
  flavor_text?: string
  power?: string
  toughness?: string
  loyalty?: string
  colors?: string[]
  image_uris?: CardImages
}

interface FormattedCardBack {
  name: string
  type?: string
  manaCost?: string
  oracleText?: string
  flavorText?: string
  power?: string
  toughness?: string
  loyalty?: string
  colors?: string[]
  image?: CardImages
}

interface ExtendedMTGGameData extends MTGGameData {
  loyalty?: string
}

interface FormattedCard extends Omit<MTGCard, 'gameData'> {
  layout?: string
  gameData: ExtendedMTGGameData
  cardBack?: FormattedCardBack
  reversibleImage?: CardImages
}

export const formatCard = (card: ScryfallCard): FormattedCard => {
  const layoutType = card.layout || 'normal'

  const checkColorless = (card: ScryfallCard | ScryfallCardFace): MTGColor[] => {
    return card.colors?.length === 0 && card.mana_cost ? ['C'] : (card.colors as MTGColor[] || [])
  }

  const checkColorlessIdentity = (card: ScryfallCard): MTGColor[] => {
    return Array.isArray(card.color_identity) &&
      card.color_identity.length === 0 &&
      card.mana_cost &&
      card.mana_cost !== ''
      ? ['C']
      : (card.color_identity as MTGColor[] || [])
  }

  const formatText = (text: string | undefined): string | undefined => text

  // Base commune pour toutes les cartes
  const baseCard: Omit<FormattedCard, 'name' | 'gameData' | 'image' | 'layout'> = {
    id: card.id || '',
    gameType: 'magic' as const,
    setCode: card.set || undefined,
    setName: card.set_name || undefined,
    lang: card.lang || 'en',
    quantity: 1,
    addedAt: new Date().toISOString().split('T')[0],
    priceHistory: [
      {
        date: new Date().toISOString().split('T')[0],
        usd: card.prices?.usd ? parseFloat(card.prices.usd) : 0,
        eur: card.prices?.eur ? parseFloat(card.prices.eur) : 0,
      },
    ],
    rarity: card.rarity as CardRarity || undefined,
    collectorNumber: card.collector_number || undefined,
    artist: card.artist || undefined,
    legalities: card.legalities || {},
    colors: checkColorlessIdentity(card),
  }

  const extractImage = (face: ScryfallCard | ScryfallCardFace): CardImages => ({
    small: face?.image_uris?.small || undefined,
    normal: face?.image_uris?.normal || undefined,
    large: face?.image_uris?.large || undefined,
    artCrop: face?.image_uris?.artCrop || undefined,
  })

  // Cas spécial des cartes réversibles
  if (layoutType === 'reversible_card') {
    const faceLayout = 'normal' // card.card_faces?.[0]?.layout n'existe pas dans ScryfallCardFace

    // Fonction interne pour gérer la face comme un layout connu
    const formatFaceAs = (layoutKind: string): FormattedCard => {
      const gameData: ExtendedMTGGameData = {
        type: card.card_faces?.[0]?.type_line || card.type_line,
        manaCost: card.card_faces?.[0]?.mana_cost || card.mana_cost,
        oracleText: card.card_faces?.[0]?.oracle_text || card.oracle_text,
        flavorText: card.card_faces?.[0]?.flavor_text || card.flavor_text,
        power: card.card_faces?.[0]?.power || card.power,
        toughness: card.card_faces?.[0]?.toughness || card.toughness,
        loyalty: card.card_faces?.[0]?.loyalty || card.loyalty,
      }

      switch (layoutKind) {
        case 'adventure':
          return {
            ...baseCard,
            layout: layoutType,
            name: card.name.split(' // ')[0],
            gameData,
            colors: checkColorless(card.card_faces?.[0] || card),
            image: extractImage(card.card_faces?.[0] || card),
            cardBack: {
              name: card.card_faces?.[1]?.name || card.name.split(' // ')[1],
              type: card.card_faces?.[1]?.type_line || undefined,
              manaCost: card.card_faces?.[1]?.mana_cost || undefined,
              oracleText: card.card_faces?.[1]?.oracle_text || undefined,
              flavorText: card.card_faces?.[1]?.flavor_text || undefined,
              power: card.card_faces?.[1]?.power || undefined,
              toughness: card.card_faces?.[1]?.toughness || undefined,
              colors: checkColorless(card.card_faces?.[1] || card),
            },
            reversibleImage: extractImage(card.card_faces?.[1] || card),
          }

        case 'split':
        case 'modal_dfc':
        case 'transform':
        case 'flip':
          return {
            ...baseCard,
            layout: layoutType,
            name: card.card_faces?.[0]?.name || card.name.split(' // ')[0],
            gameData,
            colors: checkColorless(card.card_faces?.[0] || card),
            image: extractImage(card.card_faces?.[0] || card),
            cardBack: {
              name: card.card_faces?.[1]?.name || card.name.split(' // ')[1],
              type: card.card_faces?.[1]?.type_line || undefined,
              manaCost: card.card_faces?.[1]?.mana_cost || undefined,
              oracleText: card.card_faces?.[1]?.oracle_text || undefined,
              flavorText: card.card_faces?.[1]?.flavor_text || undefined,
              loyalty: card.card_faces?.[1]?.loyalty || undefined,
              power: card.card_faces?.[1]?.power || undefined,
              toughness: card.card_faces?.[1]?.toughness || undefined,
              colors: checkColorless(card.card_faces?.[1] || card),
              image: extractImage(card.card_faces?.[1] || card),
            },
            reversibleImage: extractImage(card.card_faces?.[1] || card),
          }

        default:
          return {
            ...baseCard,
            layout: layoutType,
            name: card.card_faces?.[0]?.name || card.name,
            gameData,
            colors: checkColorless(card.card_faces?.[0] || card),
            image: extractImage(card.card_faces?.[0] || card),
            reversibleImage: extractImage(card.card_faces?.[1] || card),
          }
      }
    }

    return formatFaceAs(faceLayout)
  }

  // Layouts spéciaux classiques
  switch (layoutType) {
    case 'transform':
    case 'modal_dfc':
    case 'flip':
      return {
        ...baseCard,
        layout: layoutType,
        name: card.card_faces?.[0]?.name || card.name.split(' // ')[0],
        gameData: {
          type: card.card_faces?.[0]?.type_line || card.type_line,
          manaCost: card.card_faces?.[0]?.mana_cost || card.mana_cost,
          oracleText: card.card_faces?.[0]?.oracle_text || card.oracle_text,
          flavorText: card.card_faces?.[0]?.flavor_text || card.flavor_text,
          loyalty: card.card_faces?.[0]?.loyalty || card.loyalty,
          power: card.card_faces?.[0]?.power || card.power,
          toughness: card.card_faces?.[0]?.toughness || card.toughness,
        } as ExtendedMTGGameData,
        colors: checkColorless(card.card_faces?.[0] || card),
        image: extractImage(card.card_faces?.[0] || card),
        cardBack: {
          name: card.card_faces?.[1]?.name || card.name.split(' // ')[1],
          type: card.card_faces?.[1]?.type_line || undefined,
          manaCost: card.card_faces?.[1]?.mana_cost || undefined,
          oracleText: card.card_faces?.[1]?.oracle_text || undefined,
          flavorText: card.card_faces?.[1]?.flavor_text || undefined,
          loyalty: card.card_faces?.[1]?.loyalty || undefined,
          power: card.card_faces?.[1]?.power || undefined,
          toughness: card.card_faces?.[1]?.toughness || undefined,
          colors: checkColorless(card.card_faces?.[1] || card),
          image: extractImage(card.card_faces?.[1] || card),
        },
      }

    case 'split':
    case 'adventure':
      return {
        ...baseCard,
        layout: layoutType,
        name: card.name.split(' // ')[0],
        gameData: {
          type: card.card_faces?.[0]?.type_line || card.type_line,
          manaCost: card.card_faces?.[0]?.mana_cost || card.mana_cost,
          oracleText: card.card_faces?.[0]?.oracle_text || card.oracle_text,
          flavorText: card.card_faces?.[0]?.flavor_text || card.flavor_text,
          power: card.power || undefined,
          toughness: card.toughness || undefined,
        } as ExtendedMTGGameData,
        colors: checkColorless(card),
        image: extractImage(card),
        cardBack: {
          name: card.card_faces?.[1]?.name || card.name.split(' // ')[1],
          type: card.card_faces?.[1]?.type_line || undefined,
          manaCost: card.card_faces?.[1]?.mana_cost || undefined,
          oracleText: card.card_faces?.[1]?.oracle_text || undefined,
          flavorText: card.card_faces?.[1]?.flavor_text || undefined,
          power: card.card_faces?.[1]?.power || undefined,
          toughness: card.card_faces?.[1]?.toughness || undefined,
          colors: checkColorless(card.card_faces?.[1] || card),
        },
      }

    default:
      return {
        ...baseCard,
        layout: layoutType,
        name: card.name || '',
        gameData: {
          type: card.type_line || undefined,
          manaCost: card.mana_cost || undefined,
          oracleText: formatText(card.oracle_text) || undefined,
          flavorText: formatText(card.flavor_text) || undefined,
          power: card.power || undefined,
          toughness: card.toughness || undefined,
          loyalty: card.loyalty || undefined,
        } as ExtendedMTGGameData,
        colors: checkColorless(card),
        image: extractImage(card),
      }
  }
}

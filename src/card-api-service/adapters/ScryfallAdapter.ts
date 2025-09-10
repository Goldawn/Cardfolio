import type { ICardAdapter } from '../interfaces'
import type { MTGCard, MTGGameData, MTGCardFace, MTGColor } from '@/types/games/magic'
import type { CardImages, CardRarity } from '@/types/base'
import type { GameSet, PriceData, ScryfallCardDTO, ScryfallSetDTO } from '../dto'

/**
 * Adapter pour transformer les données Scryfall vers le format de l'application
 */
export class ScryfallAdapter implements ICardAdapter {
  readonly providerName = 'scryfall'

  transformCard(rawData: ScryfallCardDTO): MTGCard {
    if (!this.validateRawData(rawData)) {
      throw new Error('Invalid Scryfall card data')
    }

    const layoutType = rawData.layout || 'normal'

    // Gestion des couleurs
    const checkColorless = (card: ScryfallCardDTO | any): MTGColor[] => {
      return card.colors?.length === 0 && card.mana_cost ? ['C'] : (card.colors as MTGColor[] || [])
    }

    const checkColorlessIdentity = (card: ScryfallCardDTO): MTGColor[] => {
      return Array.isArray(card.color_identity) &&
        card.color_identity.length === 0 &&
        card.mana_cost &&
        card.mana_cost !== ''
        ? ['C']
        : (card.color_identity as MTGColor[] || [])
    }

    // Base commune pour toutes les cartes
    const baseCard: Omit<MTGCard, 'name' | 'gameData' | 'image' | 'layout'> = {
      id: rawData.id || '',
      gameType: 'magic' as const,
      setCode: rawData.set || undefined,
      setName: rawData.set_name || undefined,
      lang: rawData.lang || 'en',
      quantity: 1,
      addedAt: new Date().toISOString().split('T')[0],
      priceHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          usd: rawData.prices?.usd ? parseFloat(rawData.prices.usd) : 0,
          eur: rawData.prices?.eur ? parseFloat(rawData.prices.eur) : 0,
        },
      ],
      rarity: rawData.rarity as CardRarity || undefined,
      collectorNumber: rawData.collector_number || undefined,
      artist: rawData.artist || undefined,
      legalities: rawData.legalities || {},
      colors: checkColorlessIdentity(rawData),
    }

    // Extraction des images
    const extractImage = (face: ScryfallCardDTO | any): CardImages => ({
      small: face?.image_uris?.small || undefined,
      normal: face?.image_uris?.normal || undefined,
      large: face?.image_uris?.large || undefined,
      artCrop: face?.image_uris?.art_crop || undefined,
    })

    // Données de jeu spécifiques
    const gameData: MTGGameData = {
      manaCost: rawData.mana_cost || undefined,
      manaValue: rawData.cmc || undefined,
      type: rawData.type_line || undefined,
      typeLine: rawData.type_line || undefined,
      oracleText: rawData.oracle_text || undefined,
      flavorText: rawData.flavor_text || undefined,
      power: rawData.power || undefined,
      toughness: rawData.toughness || undefined,
      colorIdentity: checkColorlessIdentity(rawData),
      card_faces: rawData.card_faces?.map(face => ({
        name: face.name,
        mana_cost: face.mana_cost,
        type_line: face.type_line,
        oracle_text: face.oracle_text,
        power: face.power,
        toughness: face.toughness,
        image_uris: face.image_uris
      }))
    }

    // Cas spécial des cartes réversibles
    if (layoutType === 'transform' || layoutType === 'modal_dfc') {
      const frontFace = rawData.card_faces?.[0]
      const backFace = rawData.card_faces?.[1]

      return {
        ...baseCard,
        name: rawData.name,
        gameData,
        image: extractImage(frontFace || rawData),
        layout: layoutType,
        // Ajout des données de la face arrière
        reversibleImage: backFace ? extractImage(backFace) : undefined,
      } as MTGCard & { layout: string; reversibleImage?: CardImages }
    }

    // Carte normale
    return {
      ...baseCard,
      name: rawData.name,
      gameData,
      image: extractImage(rawData),
    }
  }

  transformSet(rawData: ScryfallSetDTO): GameSet {
    return {
      id: rawData.id,
      code: rawData.code,
      name: rawData.name,
      releaseDate: rawData.released_at,
      setType: rawData.set_type,
      cardCount: rawData.card_count,
      digital: rawData.digital,
      iconUri: rawData.icon_svg_uri,
      parentSetCode: rawData.parent_set_code,
      block: rawData.block,
      blockCode: rawData.block_code
    }
  }

  transformPrice(rawData: ScryfallCardDTO): PriceData {
    return {
      cardId: rawData.id,
      cardName: rawData.name,
      setCode: rawData.set,
      prices: {
        usd: rawData.prices?.usd ? parseFloat(rawData.prices.usd) : undefined,
        eur: rawData.prices?.eur ? parseFloat(rawData.prices.eur) : undefined,
        tix: rawData.prices?.tix ? parseFloat(rawData.prices.tix) : undefined
      },
      lastUpdated: new Date().toISOString(),
      source: this.providerName
    }
  }

  transformCards(rawDataList: ScryfallCardDTO[]): MTGCard[] {
    return rawDataList.map(card => this.transformCard(card))
  }

  transformSets(rawDataList: ScryfallSetDTO[]): GameSet[] {
    return rawDataList.map(set => this.transformSet(set))
  }

  validateRawData(rawData: any): boolean {
    return !!(
      rawData &&
      typeof rawData === 'object' &&
      rawData.id &&
      rawData.name &&
      rawData.set
    )
  }

  extractCardId(rawData: ScryfallCardDTO): string {
    return rawData.id
  }

  extractCardName(rawData: ScryfallCardDTO): string {
    return rawData.name
  }
}

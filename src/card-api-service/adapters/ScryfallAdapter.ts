import type { CardRarity } from '@/types/base'
import type { MTGColor, MTGGameData } from '@/types/games/magic'
import type { GameCard } from '@/types/utils/guards'
import { transformToGameCard } from '@/types/utils/transformers'
import type {
  GameSet,
  PriceData,
  ScryfallCardDTO,
  ScryfallSetDTO,
} from '../dto'
import type { ICardAdapter } from '../interfaces'

/**
 * Adapter pour transformer les données Scryfall vers le format de l'application
 */
export class ScryfallAdapter implements ICardAdapter {
  readonly providerName = 'scryfall'

  transformCard(rawData: ScryfallCardDTO): GameCard {
    if (!this.validateRawData(rawData)) {
      throw new Error('Invalid Scryfall card data')
    }

    // Gestion des couleurs MTG
    const checkColorlessIdentity = (card: ScryfallCardDTO): MTGColor[] => {
      return Array.isArray(card.color_identity) &&
        card.color_identity.length === 0 &&
        card.mana_cost &&
        card.mana_cost !== ''
        ? ['C']
        : (card.color_identity as MTGColor[]) || []
    }

    // Préparation des données pour le helper générique
    const rawCardData: any = {
      id: rawData.id || '',
      externalId: rawData.id || '',
      name: rawData.name || 'Unknown',
      gameType: 'magic' as const,
      setCode: rawData.set || '',
      setName: rawData.set_name || '',
      rarity: rawData.rarity as CardRarity,
      artist: rawData.artist || '',
      collectorNumber: rawData.collector_number || '',
      gameData: this.extractMTGGameData(rawData),
      priceHistory: [
        {
          date: new Date().toISOString().split('T')[0],
          usd: rawData.prices?.usd ? parseFloat(rawData.prices.usd) : 0,
          eur: rawData.prices?.eur ? parseFloat(rawData.prices.eur) : 0,
        },
      ],
    }

    // Only add image properties if they exist
    if (rawData.image_uris?.small)
      rawCardData.imageSmall = rawData.image_uris.small
    if (rawData.image_uris?.normal)
      rawCardData.imageNormal = rawData.image_uris.normal
    if (rawData.image_uris?.large)
      rawCardData.imageLarge = rawData.image_uris.large
    if (rawData.image_uris?.art_crop)
      rawCardData.imageArtCrop = rawData.image_uris.art_crop

    // Utilisation du helper générique
    const gameCard = transformToGameCard(rawCardData, 'magic')

    // Ajout des propriétés spécifiques MTG
    return {
      ...gameCard,
      colors: checkColorlessIdentity(rawData),
      legalities: rawData.legalities || {},
    } as GameCard
  }

  private extractMTGGameData(rawData: ScryfallCardDTO): MTGGameData {
    return {
      manaCost: rawData.mana_cost,
      manaValue: rawData.cmc,
      cmc: rawData.cmc,
      convertedManaCost: rawData.cmc,
      type: rawData.type_line,
      typeLine: rawData.type_line,
      oracleText: rawData.oracle_text,
      flavorText: rawData.flavor_text,
      power: rawData.power,
      toughness: rawData.toughness,
      colorIdentity: rawData.color_identity as MTGColor[],
      card_faces: rawData.card_faces,
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
      blockCode: rawData.block_code,
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
        tix: rawData.prices?.tix ? parseFloat(rawData.prices.tix) : undefined,
      },
      lastUpdated: new Date().toISOString(),
      source: this.providerName,
    }
  }

  transformCards(rawDataList: ScryfallCardDTO[]): GameCard[] {
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

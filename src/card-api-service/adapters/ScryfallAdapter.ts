import type { CardRarity } from '@/types/base'
import type { MTGColor, MTGGameData, MTGLayout, MTGSpecial } from '@/types/games/magic'
import type { GameCard } from '@/types/utils/guards'
import { transformToGameCard } from '@/types/utils/transformers'
import type {
  GameSet,
  PriceData,
  ScryfallCardDTO,
  ScryfallCardFaceDTO,
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
    const specialCard = this.extracMTGSpecial(rawData)
    // Ajout des propriétés spécifiques MTG
    return {
      ...gameCard,
      colors: checkColorlessIdentity(rawData),
      specialCard,
      legalities: rawData.legalities || {},
    } as GameCard
  }

 private extracMTGSpecial(rawData: ScryfallCardDTO): MTGSpecial {
  const today = new Date().toISOString().split('T')[0];
  const layout: MTGLayout = rawData.layout ?? 'normal';

  // ---- helpers -------------------------------------------------------------

  const asNumber = (v?: string | null) => (v ? Number(v) : 0);

  const formatText = (t?: string) => t; // hook prêt si tu veux parser les symboles MTG

  const extractImage = (src?: { image_uris?: {
    small?: string; normal?: string; large?: string; art_crop?: string;
  } }) => ({
    small: src?.image_uris?.small,
    normal: src?.image_uris?.normal,
    large: src?.image_uris?.large,
    artCrop: src?.image_uris?.art_crop,
  });

  const checkColorlessColors = (src: { colors?: string[]; mana_cost?: string | null }) => {
    const hasColors = Array.isArray(src.colors);
    if (hasColors && src.colors!.length === 0 && src.mana_cost) return ['C'] as MTGColor[];
    return (hasColors ? src.colors : undefined) as unknown as MTGColor[] | undefined;
  };

  const computeColorIdentity = (src: ScryfallCardDTO) => {
    const id = Array.isArray(src.color_identity) ? src.color_identity : [];
    if (id.length === 0 && src.mana_cost && src.mana_cost !== '') return ['C'] as MTGColor[];
    return id as MTGColor[];
  };

  const mapFace = (f?: ScryfallCardFaceDTO) => ({
    name: f?.name,
    mana_cost: f?.mana_cost,
    type_line: f?.type_line,
    oracle_text: f?.oracle_text,
    power: f?.power,
    toughness: f?.toughness,
    image_uris: f?.image_uris
      ? {
          small: f.image_uris.small,
          normal: f.image_uris.normal,
          large: f.image_uris.large,
          art_crop: f.image_uris.art_crop,
        }
      : undefined,
  });

  // ---- base commun à tous les layouts -------------------------------------

  const baseCard = {
    id: rawData.id ?? null,
    // champs "génériques" de ta carte (issus de l'ancien formatCard)
    setCode: rawData.set ?? null,
    setName: rawData.set_name ?? null,
    lang: rawData.lang ?? 'en',
    quantity: 1,
    addedAt: today,
    priceHistory: [
      { date: today, usd: asNumber(rawData.prices?.usd), eur: asNumber(rawData.prices?.eur) },
    ],
    rarity: rawData.rarity ?? null,
    collectorNumber: rawData.collector_number ?? null,
    artist: rawData.artist ?? null,
    legalities: rawData.legalities ?? {},
    // partie "données de jeu" (aligne avec MTGGameData)
    gameData: {
      gameType: 'magic' as const,
      layout,
      manaCost: rawData.mana_cost ?? undefined,
      manaValue: rawData.cmc ?? undefined,
      cmc: rawData.cmc ?? undefined,
      convertedManaCost: rawData.cmc ?? undefined,
      type: rawData.type_line ?? undefined,
      typeLine: rawData.type_line ?? undefined,
      oracleText: formatText(rawData.oracle_text ?? undefined),
      flavorText: formatText(rawData.flavor_text ?? undefined),
      power: rawData.power ?? undefined,
      toughness: rawData.toughness ?? undefined,
      colorIdentity: computeColorIdentity(rawData),
      card_faces: rawData.card_faces?.map(mapFace),
    } as MTGGameData,
  };

  // Pour certains champs "affichage" de haut niveau, on restera proche de ton formatCard
  const setRectoFrom = (src: ScryfallCardDTO | ScryfallCardFaceDTO) => {
    const faceLike: any = src;
    return {
      name: (faceLike?.name ?? (rawData.name ?? null)) as string | null,
      type: (faceLike?.type_line ?? rawData.type_line ?? null) as string | null,
      manaCost: (faceLike?.mana_cost ?? rawData.mana_cost ?? null) as string | null,
      oracleText: (formatText(faceLike?.oracle_text ?? rawData.oracle_text) ?? null) as string | null,
      flavorText: (formatText(faceLike?.flavor_text ?? rawData.flavor_text) ?? null) as string | null,
      loyalty: (faceLike?.loyalty ?? (rawData as any)?.loyalty ?? null) as string | null,
      power: (faceLike?.power ?? rawData.power ?? null) as string | null,
      toughness: (faceLike?.toughness ?? rawData.toughness ?? null) as string | null,
    };
  };

  // couleurs & image par défaut (simple face)
  const defaultColors = checkColorlessColors({ colors: rawData.colors || [], mana_cost: rawData.mana_cost || "" });
  const defaultImage = extractImage(rawData);

  // ---- layouts -------------------------------------------------------------

  // 1) reversible_card : on regarde le layout de la face 0 et on formate comme si c'était ce layout
  if (layout === 'reversible_card') {
    const face0 = rawData.card_faces?.[0];
    const face1 = rawData.card_faces?.[1];
    const faceLayout = (face0 as any)?.layout ?? 'normal';

    const recto = setRectoFrom(face0 ?? rawData);
    const rectoColors = checkColorlessColors({ colors: (face0 as any)?.colors ||[], mana_cost: face0?.mana_cost || ""});
    const rectoImage = extractImage(face0 as any);

    const verso = {
      name: (face1?.name ?? rawData.name?.split(' // ')[1] ?? null) as string | null,
      type: (face1?.type_line ?? null) as string | null,
      manaCost: (face1?.mana_cost ?? null) as string | null,
      oracleText: (formatText(face1?.oracle_text) ?? null) as string | null,
      flavorText: (formatText((face1 as any)?.flavor_text) ?? null) as string | null,
      loyalty: ((face1 as any)?.loyalty ?? null) as string | null,
      power: (face1?.power ?? null) as string | null,
      toughness: (face1?.toughness ?? null) as string | null,
      colors: checkColorlessColors({ colors: (face1 as any)?.colors, mana_cost: face1?.mana_cost || ""}),
      image: extractImage(face1 as any),
    };

    const reversibleImage = extractImage(face1 as any);

    const formatted = {
      ...baseCard,
      layout,
      ...recto,
      colors: rectoColors,
      image: rectoImage,
      cardBack: verso,
      reversibleImage,
    };

    return [formatted] as unknown as MTGSpecial;
  }

  // 2) DFC/flip classiques
  if (layout === 'transform' || layout === 'modal_dfc' || layout === 'flip') {
    const face0 = rawData.card_faces?.[0];
    const face1 = rawData.card_faces?.[1];

    const recto = setRectoFrom(face0 ?? rawData);
    const rectoColors = checkColorlessColors({ colors: (face0 as any)?.colors, mana_cost: face0?.mana_cost || ""});
    const rectoImage = extractImage(face0 as any);

    const verso = {
      name: (face1?.name ?? rawData.name?.split(' // ')[1] ?? null) as string | null,
      type: (face1?.type_line ?? null) as string | null,
      manaCost: (face1?.mana_cost ?? null) as string | null,
      oracleText: (formatText(face1?.oracle_text) ?? null) as string | null,
      flavorText: (formatText((face1 as any)?.flavor_text) ?? null) as string | null,
      loyalty: ((face1 as any)?.loyalty ?? null) as string | null,
      power: (face1?.power ?? null) as string | null,
      toughness: (face1?.toughness ?? null) as string | null,
      colors: checkColorlessColors({ colors: (face1 as any)?.colors, mana_cost: face1?.mana_cost  || ""}),
      image: extractImage(face1 as any),
    };

    const formatted = {
      ...baseCard,
      layout,
      ...recto,
      colors: rectoColors,
      image: rectoImage,
      cardBack: verso,
    };

    return [formatted] as unknown as MTGSpecial;
  }

  // 3) split / adventure
  if (layout === 'split' || layout === 'adventure') {
    const face0 = rawData.card_faces?.[0];
    const face1 = rawData.card_faces?.[1];

    const recto = {
      name: (rawData.name?.split(' // ')[0] ?? face0?.name ?? rawData.name ?? null) as string | null,
      type: (face0?.type_line ?? null) as string | null,
      manaCost: (face0?.mana_cost ?? null) as string | null,
      oracleText: (formatText(face0?.oracle_text) ?? null) as string | null,
      flavorText: (formatText((face0 as any)?.flavor_text) ?? null) as string | null,
      power: (rawData.power ?? null) as string | null,       // comme ton formatCard
      toughness: (rawData.toughness ?? null) as string | null,
      loyalty: ((rawData as any)?.loyalty ?? null) as string | null,
    };

    const verso = {
      name: (face1?.name ?? rawData.name?.split(' // ')[1] ?? null) as string | null,
      type: (face1?.type_line ?? null) as string | null,
      manaCost: (face1?.mana_cost ?? null) as string | null,
      oracleText: (formatText(face1?.oracle_text) ?? null) as string | null,
      flavorText: (formatText((face1 as any)?.flavor_text) ?? null) as string | null,
      power: (face1?.power ?? null) as string | null,
      toughness: (face1?.toughness ?? null) as string | null,
      colors: checkColorlessColors({ colors: (face1 as any)?.colors, mana_cost: face1?.mana_cost  || ""}),
    };

    const formatted = {
      ...baseCard,
      layout,
      ...recto,
      colors: checkColorlessColors({ colors: rawData.colors  || [], mana_cost: rawData.mana_cost  || ""}),
      image: extractImage(rawData), // top-level image pour split/adventure (comme dans ton code)
      cardBack: verso,
    };

    return [formatted] as unknown as MTGSpecial;
  }

  // 4) défaut : simple face
  const recto = {
    name: (rawData.name ?? null) as string | null,
    type: (rawData.type_line ?? null) as string | null,
    manaCost: (rawData.mana_cost ?? null) as string | null,
    oracleText: (formatText(rawData.oracle_text) ?? null) as string | null,
    flavorText: (formatText(rawData.flavor_text) ?? null) as string | null,
    power: (rawData.power ?? null) as string | null,
    toughness: (rawData.toughness ?? null) as string | null,
    loyalty: ((rawData as any)?.loyalty ?? null) as string | null,
  };

  const formatted = {
    ...baseCard,
    layout,
    ...recto,
    colors: defaultColors,
    image: defaultImage,
  };

  return [formatted] as unknown as MTGSpecial;
}


  private extractMTGGameData(rawData: ScryfallCardDTO): MTGGameData {
    return {
      gameType: 'magic',
      layout: rawData.layout,
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

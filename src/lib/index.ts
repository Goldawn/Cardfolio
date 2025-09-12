// Export centralisé des utilitaires lib
// ====================================

// MTG utilities
export * from './mtgCards'
export * from './mtgFormats'
export * from './mtgIcons'
export * from './mtgSorts'
export * from './mtgSections'

// Statistics and deck utilities (excluding isLand to avoid conflict with mtgCards)
export { 
  getManaValue, 
  parseManaCost, 
  computeManaCurveSplit, 
  computeManaCurve, 
  getCardColors, 
  computeColorDistribution 
} from './deckStats'

// Authentication utilities
export * from './getAuthenticatedUser'

// Database
export * from './prisma'

// Auth configuration
export * from './auth'
export * from './auth.config'

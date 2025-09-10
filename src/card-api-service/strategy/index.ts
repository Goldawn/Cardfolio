/**
 * Export des stratégies
 */

export {
  ProviderSelectionStrategyFactory,
  PriorityBasedStrategy,
  PerformanceBasedStrategy,
  RoundRobinStrategy,
  AdaptiveStrategy,
  type IProviderSelectionStrategy,
  type ProviderInfo,
  type SelectionContext
} from './ProviderSelectionStrategy'

export {
  FallbackService,
  SimpleFallbackStrategy,
  ExponentialBackoffFallbackStrategy,
  IntelligentFallbackStrategy,
  type IFallbackStrategy,
  type FallbackConfig,
  type FallbackContext,
  type FallbackResult,
  DEFAULT_FALLBACK_CONFIG
} from './FallbackStrategy'

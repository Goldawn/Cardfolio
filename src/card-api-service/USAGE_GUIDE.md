# Guide d'Utilisation - Card API Service

## 🚀 **Comment Utiliser les Nouveaux Services dans Votre Application**

### **1. Configuration de Base**

```typescript
import { 
  CardServiceFactory,
  CacheService,
  RateLimitService,
  MonitoringService,
  DEFAULT_RATE_LIMIT_CONFIG,
  DEFAULT_MONITORING_CONFIG
} from '@/card-api-service'

// Configuration des services
const config = {
  cache: {
    enabled: true,
    ttl: 3600, // 1 heure
    provider: 'memory' as const
  },
  rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
  monitoring: {
    ...DEFAULT_MONITORING_CONFIG,
    enabled: true
  }
}

// Initialisation
const cardService = CardServiceFactory.create(config)
const cacheService = new CacheService(config.cache)
const rateLimitService = new RateLimitService(config.rateLimit)
const monitoringService = new MonitoringService(config.monitoring)
```

### **2. Utilisation dans un Composant React**

```typescript
import { useCardApi } from '@/card-api-service/examples/real-world-integration'

const MyComponent = () => {
  const { fetchCard, searchCards, isLoading, healthStatus } = useCardApi()
  
  const handleFetchCard = async (cardId: string) => {
    try {
      const card = await fetchCard(cardId)
      console.log('Carte récupérée:', card)
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  return (
    <div>
      {healthStatus && (
        <div className={`status ${healthStatus.status}`}>
          API Status: {healthStatus.status.toUpperCase()}
        </div>
      )}
      
      <button 
        onClick={() => handleFetchCard('card-id')}
        disabled={isLoading}
      >
        {isLoading ? 'Chargement...' : 'Récupérer Carte'}
      </button>
    </div>
  )
}
```

### **3. MonitoringService - Visualisation des Résultats**

#### **A. Métriques en Temps Réel**

```typescript
// Obtenir les statistiques
const stats = monitoringService.getStats()
console.log('Total requêtes:', stats.totalRequests)
console.log('Taux d\'erreur:', stats.errorRate)
console.log('Temps moyen:', stats.averageResponseTime)

// Obtenir l'état de santé
const health = await monitoringService.getHealthStatus()
console.log('Statut:', health.status) // 'healthy', 'degraded', 'unhealthy'
console.log('Services:', health.services)
```

#### **B. Dashboard de Monitoring**

```typescript
import { MonitoringDashboard } from '@/card-api-service/examples/monitoring-dashboard-example'

const dashboard = new MonitoringDashboard()

// Rapport JSON pour API
const apiReport = await dashboard.getApiReport()
// Retourne: { status, timestamp, metrics, services }

// Rapport HTML pour affichage web
const htmlReport = await dashboard.generateHtmlReport()
// Retourne: HTML complet avec CSS

// Alertes automatiques
const alerts = await dashboard.generateAlerts()
// Retourne: [{ level, message, timestamp }]
```

#### **C. API Routes pour le Monitoring**

```typescript
// pages/api/monitoring/health.ts
export default async function handler(req, res) {
  const monitoringService = new MonitoringService(DEFAULT_MONITORING_CONFIG)
  const health = await monitoringService.getHealthStatus()
  res.status(200).json(health)
}

// pages/api/monitoring/metrics.ts
export default async function handler(req, res) {
  const monitoringService = new MonitoringService(DEFAULT_MONITORING_CONFIG)
  const stats = monitoringService.getStats()
  res.status(200).json(stats)
}
```

### **4. CacheService - Gestion du Cache**

```typescript
// Mettre en cache
await cacheService.setCard('card-id', cardData)
await cacheService.setSets(setsData)
await cacheService.setPrice('card-id', priceData)

// Récupérer du cache
const cachedCard = await cacheService.getCard('card-id')
const cachedSets = await cacheService.getSets()
const cachedPrice = await cacheService.getPrice('card-id')

// Invalider le cache
await cacheService.invalidateCard('card-id')
await cacheService.invalidateSets()
await cacheService.clear() // Vider tout le cache
```

### **5. RateLimitService - Gestion des Limites**

```typescript
// Vérifier si une requête est autorisée
const result = rateLimitService.checkScryfallRequest()
if (result.allowed) {
  // Faire la requête
} else {
  console.log('Attendre:', result.retryAfter, 'secondes')
}

// Attendre automatiquement
await rateLimitService.waitForScryfallAvailability()

// Obtenir les informations de rate limiting
const info = rateLimitService.getInfo('scryfall')
console.log('Limite:', info.limit)
console.log('Restant:', info.remaining)
console.log('Reset:', new Date(info.resetTime))
```

### **6. Intégration Complète avec Monitoring**

```typescript
class CardApiManager {
  constructor() {
    this.cacheService = new CacheService(config.cache)
    this.rateLimitService = new RateLimitService(config.rateLimit)
    this.monitoringService = new MonitoringService(config.monitoring)
    this.cardService = CardServiceFactory.create(config)
  }

  async fetchCard(cardId: string) {
    const startTime = Date.now()
    
    try {
      // 1. Vérifier le cache
      const cachedCard = await this.cacheService.getCard(cardId)
      if (cachedCard) {
        this.monitoringService.recordCacheHit('scryfall', 'card')
        return cachedCard
      }

      // 2. Vérifier les limites
      await this.rateLimitService.waitForScryfallAvailability()

      // 3. Faire la requête
      const card = await this.cardService.fetchCard({ cardId })
      
      // 4. Mettre en cache
      await this.cacheService.setCard(cardId, card)
      this.monitoringService.recordCacheMiss('scryfall', 'card')

      // 5. Enregistrer les métriques
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards',
        'GET',
        responseTime,
        200,
        true
      )

      return card
    } catch (error) {
      // Enregistrer l'erreur
      const responseTime = Date.now() - startTime
      this.monitoringService.recordApiCall(
        'scryfall',
        '/cards',
        'GET',
        responseTime,
        500,
        false
      )
      throw error
    }
  }
}
```

## 📊 **Où Voir les Résultats du MonitoringService**

### **1. Console/Logs**
```typescript
// Afficher les métriques dans la console
const stats = monitoringService.getStats()
console.log('📊 Métriques:', stats)

// Afficher l'état de santé
const health = await monitoringService.getHealthStatus()
console.log('🏥 Santé:', health)
```

### **2. Dashboard Web**
```typescript
// Générer un rapport HTML
const dashboard = new MonitoringDashboard()
const htmlReport = await dashboard.generateHtmlReport()

// Afficher dans une page
document.body.innerHTML = htmlReport
```

### **3. API Endpoints**
```typescript
// GET /api/monitoring/health
// Retourne: { status, timestamp, services, metrics }

// GET /api/monitoring/metrics  
// Retourne: { totalRequests, totalErrors, errorRate, averageResponseTime }

// GET /api/monitoring/report
// Retourne: HTML complet du dashboard
```

### **4. Composant React**
```typescript
const MonitoringWidget = () => {
  const [metrics, setMetrics] = useState(null)
  
  useEffect(() => {
    const monitoringService = new MonitoringService(DEFAULT_MONITORING_CONFIG)
    const stats = monitoringService.getStats()
    setMetrics(stats)
  }, [])

  return (
    <div className="monitoring-widget">
      <h3>Monitoring Card API</h3>
      <p>Requêtes: {metrics?.totalRequests}</p>
      <p>Erreurs: {metrics?.totalErrors}</p>
      <p>Taux d'erreur: {metrics?.errorRate?.toFixed(2)}%</p>
      <p>Temps moyen: {metrics?.averageResponseTime?.toFixed(2)}ms</p>
    </div>
  )
}
```

## 🎯 **Exemples Pratiques**

### **1. Page d'Administration**
```typescript
// pages/admin/monitoring.tsx
export default function AdminMonitoring() {
  const [healthStatus, setHealthStatus] = useState(null)
  
  useEffect(() => {
    const fetchHealth = async () => {
      const response = await fetch('/api/monitoring/health')
      const health = await response.json()
      setHealthStatus(health)
    }
    
    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Toutes les 30s
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h1>Monitoring Card API Service</h1>
      {healthStatus && (
        <div>
          <p>Statut: {healthStatus.status}</p>
          <p>Requêtes: {healthStatus.metrics.totalRequests}</p>
          <p>Erreurs: {healthStatus.metrics.totalErrors}</p>
        </div>
      )}
    </div>
  )
}
```

### **2. Widget de Santé**
```typescript
// components/HealthIndicator.tsx
export const HealthIndicator = () => {
  const [status, setStatus] = useState('unknown')
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/monitoring/health')
        const health = await response.json()
        setStatus(health.status)
      } catch (error) {
        setStatus('unhealthy')
      }
    }
    
    checkHealth()
    const interval = setInterval(checkHealth, 60000) // Toutes les minutes
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`health-indicator ${status}`}>
      <span className="status-dot"></span>
      API Status: {status.toUpperCase()}
    </div>
  )
}
```

### **3. Alertes Automatiques**
```typescript
// utils/monitoring-alerts.ts
export const checkAlerts = async () => {
  const response = await fetch('/api/monitoring/metrics')
  const metrics = await response.json()
  
  const alerts = []
  
  if (metrics.errorRate > 10) {
    alerts.push({
      level: 'warning',
      message: `Taux d'erreur élevé: ${metrics.errorRate.toFixed(2)}%`
    })
  }
  
  if (metrics.averageResponseTime > 5000) {
    alerts.push({
      level: 'warning', 
      message: `Temps de réponse élevé: ${metrics.averageResponseTime.toFixed(2)}ms`
    })
  }
  
  return alerts
}
```

## 🔧 **Configuration Avancée**

### **Variables d'Environnement**
```env
CARD_API_CACHE_ENABLED=true
CARD_API_CACHE_TTL=3600
CARD_API_MONITORING_ENABLED=true
CARD_API_LOG_LEVEL=info
```

### **Configuration Personnalisée**
```typescript
const customConfig = {
  cache: {
    enabled: true,
    ttl: 7200, // 2 heures
    provider: 'memory'
  },
  monitoring: {
    enabled: true,
    metrics: {
      collectApiCalls: true,
      collectResponseTimes: true,
      collectErrorRates: true,
      collectCacheHitRates: true
    },
    alerts: {
      enabled: true,
      errorRateThreshold: 5, // 5%
      responseTimeThreshold: 3000 // 3 secondes
    }
  }
}
```

## 📈 **Métriques Disponibles**

- **Total Requêtes** : Nombre total d'appels API
- **Total Erreurs** : Nombre d'erreurs rencontrées
- **Taux d'Erreur** : Pourcentage d'erreurs
- **Temps de Réponse Moyen** : Temps moyen des requêtes
- **Requêtes par Provider** : Répartition par API
- **Requêtes par Endpoint** : Répartition par endpoint
- **Taux de Hit de Cache** : Efficacité du cache
- **État des Services** : Santé de chaque service

## 🚨 **Alertes Automatiques**

Le MonitoringService peut générer des alertes automatiques pour :
- Taux d'erreur élevé (> 10% par défaut)
- Temps de réponse élevé (> 5s par défaut)
- Services en panne
- Problèmes de cache

Ces alertes peuvent être intégrées dans votre système de notification ou dashboard d'administration.

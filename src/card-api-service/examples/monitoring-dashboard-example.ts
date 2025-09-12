/**
 * Exemple de dashboard pour visualiser les résultats du MonitoringService
 */

import { DEFAULT_MONITORING_CONFIG, MonitoringService } from '../index'

// ========================================
// 1. DASHBOARD DE MONITORING
// ========================================

export class MonitoringDashboard {
  public monitoringService: MonitoringService

  constructor() {
    this.monitoringService = new MonitoringService({
      ...DEFAULT_MONITORING_CONFIG,
      enabled: true,
      metrics: {
        collectApiCalls: true,
        collectResponseTimes: true,
        collectErrorRates: true,
        collectCacheHitRates: true,
      },
      healthChecks: {
        enabled: true,
        interval: 10000, // 10 secondes
      },
    })
  }

  /**
   * Génère un rapport de monitoring complet
   */
  async generateMonitoringReport() {
    const healthStatus = await this.monitoringService.getHealthStatus()
    const stats = this.monitoringService.getStats()
    const healthReport = await this.monitoringService.getHealthReport()

    return {
      timestamp: new Date().toISOString(),
      health: healthStatus,
      statistics: stats,
      report: healthReport,
    }
  }

  /**
   * Génère un rapport JSON pour API
   */
  async getApiReport() {
    const health = await this.monitoringService.getHealthStatus()
    const stats = this.monitoringService.getStats()

    return {
      status: health.status,
      timestamp: health.timestamp,
      metrics: {
        totalRequests: stats.totalRequests,
        totalErrors: stats.totalErrors,
        errorRate: stats.errorRate,
        averageResponseTime: stats.averageResponseTime,
        requestsByProvider: stats.requestsByProvider,
        requestsByEndpoint: stats.requestsByEndpoint,
      },
      services: health.services,
    }
  }

  /**
   * Génère un rapport HTML pour affichage web
   */
  async generateHtmlReport() {
    const report = await this.generateMonitoringReport()

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Card API Service - Monitoring Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .status-healthy { color: green; }
          .status-degraded { color: orange; }
          .status-unhealthy { color: red; }
          .metric-box { border: 1px solid #ccc; padding: 10px; margin: 10px 0; }
          .metric-value { font-size: 24px; font-weight: bold; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <h1>Card API Service - Monitoring Dashboard</h1>
        <p>Généré le: ${new Date(report.timestamp).toLocaleString()}</p>
        
        <div class="metric-box">
          <h2>État Global</h2>
          <p class="status-${report.health.status}">
            Statut: ${report.health.status.toUpperCase()}
          </p>
        </div>

        <div class="metric-box">
          <h2>Métriques Principales</h2>
          <div class="metric-value">${report.statistics.totalRequests}</div>
          <p>Total Requêtes</p>
          
          <div class="metric-value">${report.statistics.totalErrors}</div>
          <p>Total Erreurs</p>
          
          <div class="metric-value">${report.statistics.errorRate.toFixed(2)}%</div>
          <p>Taux d'Erreur</p>
          
          <div class="metric-value">${report.statistics.averageResponseTime.toFixed(2)}ms</div>
          <p>Temps de Réponse Moyen</p>
        </div>

        <div class="metric-box">
          <h2>Requêtes par Provider</h2>
          <table>
            <tr><th>Provider</th><th>Requêtes</th></tr>
            ${Object.entries(report.statistics.requestsByProvider)
              .map(
                ([provider, count]) =>
                  `<tr><td>${provider}</td><td>${count}</td></tr>`
              )
              .join('')}
          </table>
        </div>

        <div class="metric-box">
          <h2>Requêtes par Endpoint</h2>
          <table>
            <tr><th>Endpoint</th><th>Requêtes</th></tr>
            ${Object.entries(report.statistics.requestsByEndpoint)
              .map(
                ([endpoint, count]) =>
                  `<tr><td>${endpoint}</td><td>${count}</td></tr>`
              )
              .join('')}
          </table>
        </div>

        <div class="metric-box">
          <h2>État des Services</h2>
          <table>
            <tr><th>Service</th><th>Statut</th><th>Dernière Vérification</th></tr>
            ${Object.entries(report.health.services)
              .map(
                ([service, info]) => `
                <tr>
                  <td>${service}</td>
                  <td class="status-${info.status}">${info.status.toUpperCase()}</td>
                  <td>${new Date(info.lastCheck).toLocaleString()}</td>
                </tr>
              `
              )
              .join('')}
          </table>
        </div>

        <div class="metric-box">
          <h2>Rapport Complet</h2>
          <pre>${report.report}</pre>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Génère des alertes basées sur les métriques
   */
  async generateAlerts() {
    const health = await this.monitoringService.getHealthStatus()
    const stats = this.monitoringService.getStats()

    const alerts = []

    // Alerte sur le taux d'erreur
    if (stats.errorRate > 10) {
      alerts.push({
        level: 'warning',
        message: `Taux d'erreur élevé: ${stats.errorRate.toFixed(2)}%`,
        timestamp: new Date().toISOString(),
      })
    }

    // Alerte sur le temps de réponse
    if (stats.averageResponseTime > 5000) {
      alerts.push({
        level: 'warning',
        message: `Temps de réponse élevé: ${stats.averageResponseTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      })
    }

    // Alerte sur l'état des services
    Object.entries(health.services).forEach(([service, info]) => {
      if (info.status === 'unhealthy') {
        alerts.push({
          level: 'error',
          message: `Service ${service} est en panne`,
          timestamp: new Date().toISOString(),
        })
      }
    })

    return alerts
  }
}

// ========================================
// 2. EXEMPLE D'UTILISATION DANS UNE API ROUTE
// ========================================

export const createMonitoringApiRoutes = () => {
  const dashboard = new MonitoringDashboard()

  return {
    // Route pour obtenir les métriques en JSON
    async getMetrics() {
      return await dashboard.getApiReport()
    },

    // Route pour obtenir le rapport HTML
    async getHtmlReport() {
      return await dashboard.generateHtmlReport()
    },

    // Route pour obtenir les alertes
    async getAlerts() {
      return await dashboard.generateAlerts()
    },

    // Route pour obtenir l'état de santé
    async getHealth() {
      const health = await dashboard.monitoringService.getHealthStatus()
      return {
        status: health.status,
        timestamp: health.timestamp,
        services: health.services,
      }
    },
  }
}

// ========================================
// 3. EXEMPLE D'UTILISATION DANS UN COMPOSANT REACT
// ========================================

// Note: Ce code JSX nécessite React
// Il est commenté car ce fichier est en TypeScript pur

/*
export const MonitoringWidget = () => {
  const [metrics, setMetrics] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const dashboard = new MonitoringDashboard()
    
    const updateMetrics = async () => {
      try {
        const [metricsData, alertsData] = await Promise.all([
          dashboard.getApiReport(),
          dashboard.generateAlerts()
        ])
        
        setMetrics(metricsData)
        setAlerts(alertsData)
      } catch (error) {
        console.error('Erreur lors de la récupération des métriques:', error)
      } finally {
        setLoading(false)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [])

  if (loading) return <div>Chargement des métriques...</div>

  return (
    <div className="monitoring-widget">
      <h2>Monitoring Card API Service</h2>
      // ... reste du JSX
    </div>
  )
}
*/

// ========================================
// 4. EXEMPLE D'UTILISATION DANS UNE API ROUTE NEXT.JS
// ========================================

// pages/api/monitoring/health.ts
export const healthApiHandler = async (_req: any, res: any) => {
  const dashboard = new MonitoringDashboard()

  try {
    const health = await dashboard.monitoringService.getHealthStatus()
    res.status(200).json(health)
  } catch (_error) {
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération de la santé' })
  }
}

// pages/api/monitoring/metrics.ts
export const metricsApiHandler = async (_req: any, res: any) => {
  const dashboard = new MonitoringDashboard()

  try {
    const metrics = await dashboard.getApiReport()
    res.status(200).json(metrics)
  } catch (_error) {
    res
      .status(500)
      .json({ error: 'Erreur lors de la récupération des métriques' })
  }
}

// pages/api/monitoring/report.ts
export const reportApiHandler = async (_req: any, res: any) => {
  const dashboard = new MonitoringDashboard()

  try {
    const htmlReport = await dashboard.generateHtmlReport()
    res.setHeader('Content-Type', 'text/html')
    res.status(200).send(htmlReport)
  } catch (_error) {
    res.status(500).json({ error: 'Erreur lors de la génération du rapport' })
  }
}

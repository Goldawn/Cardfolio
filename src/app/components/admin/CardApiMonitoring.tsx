'use client'

import { useState, useEffect } from 'react'
import { useCardApi } from '@/app/hooks/useCardApi'
import styles from './CardApiMonitoring.module.css'

export default function CardApiMonitoring() {
  const { healthStatus, getMonitoringStats, clearCache } = useCardApi()
  const [stats, setStats] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const updateStats = () => {
      const currentStats = getMonitoringStats()
      setStats(currentStats)
    }

    updateStats()
    const interval = setInterval(updateStats, 30000) // Toutes les 30 secondes

    return () => clearInterval(interval)
  }, [getMonitoringStats])

  const handleClearCache = async () => {
    if (confirm('Êtes-vous sûr de vouloir vider le cache ?')) {
      await clearCache()
      alert('Cache vidé avec succès')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#4CAF50'
      case 'degraded': return '#FF9800'
      case 'unhealthy': return '#F44336'
      default: return '#9E9E9E'
    }
  }

  return (
    <div className={styles.monitoringContainer}>
      <h2>Monitoring Card API Service</h2>
      
      {/* Statut de santé */}
      <div className={styles.healthStatus}>
        <h3>État du Service</h3>
        <div 
          className={styles.statusIndicator}
          style={{ backgroundColor: getStatusColor(healthStatus?.status) }}
        >
          {healthStatus?.status?.toUpperCase() || 'UNKNOWN'}
        </div>
        <p>Dernière mise à jour: {new Date(healthStatus?.timestamp || Date.now()).toLocaleString()}</p>
      </div>

      {/* Métriques principales */}
      {stats && (
        <div className={styles.metrics}>
          <h3>Métriques</h3>
          <div className={styles.metricsGrid}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Total Requêtes:</span>
              <span className={styles.metricValue}>{stats.totalRequests}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Total Erreurs:</span>
              <span className={styles.metricValue}>{stats.totalErrors}</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Taux d'Erreur:</span>
              <span className={styles.metricValue}>{stats.errorRate.toFixed(2)}%</span>
            </div>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Temps Moyen:</span>
              <span className={styles.metricValue}>{stats.averageResponseTime.toFixed(2)}ms</span>
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      {healthStatus?.services && (
        <div className={styles.services}>
          <h3>Services</h3>
          <div className={styles.servicesList}>
            {Object.entries(healthStatus.services).map(([service, info]: [string, any]) => (
              <div key={service} className={`${styles.serviceItem} ${styles[info.status]}`}>
                <span className={styles.serviceName}>{service}</span>
                <span className={styles.serviceStatus}>{info.status.toUpperCase()}</span>
                <span className={styles.serviceTime}>
                  {new Date(info.lastCheck).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Détails avancés */}
      <div className={styles.advancedSection}>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className={styles.toggleButton}
        >
          {showDetails ? 'Masquer' : 'Afficher'} les détails
        </button>
        
        {showDetails && stats && (
          <div className={styles.details}>
            <h4>Requêtes par Provider</h4>
            <div className={styles.providerStats}>
            {Object.entries(stats.requestsByProvider).map(([provider, count]) => (
              <div key={provider} className={styles.providerItem}>
                <span>{provider}:</span>
                <span>{String(count)} requêtes</span>
              </div>
            ))}
            </div>
            
            <h4>Requêtes par Endpoint</h4>
            <div className={styles.endpointStats}>
              {Object.entries(stats.requestsByEndpoint).map(([endpoint, count]) => (
                <div key={endpoint} className={styles.endpointItem}>
                  <span>{endpoint}:</span>
                  <span>{String(count)} requêtes</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button 
          onClick={handleClearCache}
          className={styles.clearCacheButton}
        >
          Vider le Cache
        </button>
      </div>

      {/* Messages d'erreur */}
      {stats && stats.errorRate > 10 && (
        <div className={styles.alert}>
          ⚠️ Taux d'erreur élevé détecté ({stats.errorRate.toFixed(2)}%)
        </div>
      )}
      
      {stats && stats.averageResponseTime > 5000 && (
        <div className={styles.alert}>
          ⚠️ Temps de réponse élevé détecté ({stats.averageResponseTime.toFixed(2)}ms)
        </div>
      )}
    </div>
  )
}

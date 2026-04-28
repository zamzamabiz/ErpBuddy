/**
 * ERPBUDDY - ALERT SYSTEM
 * Monitors business conditions and triggers alerts
 */

const fs = require('fs');
const path = require('path');

// Alert log file
const ALERT_LOG_PATH = path.join(__dirname, '../../logs/alerts.log');

// Ensure logs directory exists
const logsDir = path.dirname(ALERT_LOG_PATH);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Alert types
 */
const AlertType = {
  NEGATIVE_STOCK: 'NEGATIVE_STOCK',
  NEGATIVE_PROFIT: 'NEGATIVE_PROFIT',
  API_ERROR_SPIKE: 'API_ERROR_SPIKE',
  LOW_STOCK: 'LOW_STOCK',
  HIGH_VALUE_TRANSACTION: 'HIGH_VALUE_TRANSACTION',
  SYSTEM_ERROR: 'SYSTEM_ERROR'
};

/**
 * Alert severity levels
 */
const Severity = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Store recent alerts in memory (for API access)
const recentAlerts = [];
const MAX_ALERTS = 100;

/**
 * Log alert to file and memory
 */
function logAlert(type, message, details = {}, severity = Severity.MEDIUM) {
  const alert = {
    id: `ALT-${Date.now()}`,
    type,
    message,
    details,
    severity,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };

  // Add to memory
  recentAlerts.unshift(alert);
  if (recentAlerts.length > MAX_ALERTS) {
    recentAlerts.pop();
  }

  // Log to file
  const logEntry = JSON.stringify(alert);
  fs.appendFileSync(ALERT_LOG_PATH, logEntry + '\n');

  // Console output for immediate visibility
  const severityEmoji = {
    [Severity.LOW]: '🟢',
    [Severity.MEDIUM]: '🟡',
    [Severity.HIGH]: '🟠',
    [Severity.CRITICAL]: '🔴'
  };

  console.log(`${severityEmoji[severity]} ALERT [${type}]: ${message}`);

  return alert;
}

/**
 * Check for negative stock
 */
function checkNegativeStock(item, quantity, tenantId) {
  if (quantity < 0) {
    return logAlert(
      AlertType.NEGATIVE_STOCK,
      `Negative stock detected for item: ${item.name || item}`,
      { itemId: item._id, quantity, tenantId },
      Severity.HIGH
    );
  }
  return null;
}

/**
 * Check for negative profit
 */
function checkNegativeProfit(sale, tenantId) {
  const profit = sale.netAmount - sale.totalCOGS - (sale.totalExpenses || 0);
  
  if (profit < 0) {
    return logAlert(
      AlertType.NEGATIVE_PROFIT,
      `Negative profit detected on sale: ${sale.salesNumber}`,
      {
        saleId: sale._id,
        salesNumber: sale.salesNumber,
        revenue: sale.netAmount,
        cogs: sale.totalCOGS,
        expenses: sale.totalExpenses || 0,
        profit,
        tenantId
      },
      Severity.MEDIUM
    );
  }
  return null;
}

/**
 * Check for low stock
 */
function checkLowStock(item, threshold = 10) {
  if (item.currentStock !== undefined && item.currentStock < threshold) {
    return logAlert(
      AlertType.LOW_STOCK,
      `Low stock alert for item: ${item.name}`,
      {
        itemId: item._id,
        itemName: item.name,
        currentStock: item.currentStock,
        threshold,
        tenantId: item.tenantId
      },
      Severity.MEDIUM
    );
  }
  return null;
}

/**
 * Check for high value transaction
 */
function checkHighValueTransaction(amount, threshold = 100000, type = 'transaction', tenantId) {
  if (amount > threshold) {
    return logAlert(
      AlertType.HIGH_VALUE_TRANSACTION,
      `High value ${type} detected: ${amount}`,
      { amount, threshold, type, tenantId },
      Severity.LOW
    );
  }
  return null;
}

/**
 * Log system error
 */
function logSystemError(error, context = {}) {
  return logAlert(
    AlertType.SYSTEM_ERROR,
    error.message || 'System error occurred',
    {
      stack: error.stack,
      ...context
    },
    Severity.HIGH
  );
}

/**
 * Get recent alerts
 */
function getRecentAlerts(limit = 20, filters = {}) {
  let alerts = recentAlerts;

  // Apply filters
  if (filters.type) {
    alerts = alerts.filter(a => a.type === filters.type);
  }
  if (filters.severity) {
    alerts = alerts.filter(a => a.severity === filters.severity);
  }
  if (filters.acknowledged !== undefined) {
    alerts = alerts.filter(a => a.acknowledged === filters.acknowledged);
  }

  return alerts.slice(0, limit);
}

/**
 * Get alert summary
 */
function getAlertSummary() {
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recent = recentAlerts.filter(a => new Date(a.timestamp) > last24Hours);
  
  return {
    total: recentAlerts.length,
    last24Hours: recent.length,
    byType: {},
    bySeverity: {
      [Severity.LOW]: recent.filter(a => a.severity === Severity.LOW).length,
      [Severity.MEDIUM]: recent.filter(a => a.severity === Severity.MEDIUM).length,
      [Severity.HIGH]: recent.filter(a => a.severity === Severity.HIGH).length,
      [Severity.CRITICAL]: recent.filter(a => a.severity === Severity.CRITICAL).length
    },
    unacknowledged: recent.filter(a => !a.acknowledged).length
  };
}

/**
 * Acknowledge alert
 */
function acknowledgeAlert(alertId) {
  const alert = recentAlerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    return alert;
  }
  return null;
}

module.exports = {
  AlertType,
  Severity,
  logAlert,
  checkNegativeStock,
  checkNegativeProfit,
  checkLowStock,
  checkHighValueTransaction,
  logSystemError,
  getRecentAlerts,
  getAlertSummary,
  acknowledgeAlert
};
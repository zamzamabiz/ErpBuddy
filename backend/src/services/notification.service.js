// Generic Notification Service
class NotificationService {
  async notify(userId, message, meta = {}) {
    // Placeholder: integrate with Notification model and channels
    // For now, just print to console
    console.log('[NOTIFY]', { userId, message, meta });
  }
}

module.exports = new NotificationService();

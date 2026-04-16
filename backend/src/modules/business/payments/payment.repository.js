const BaseRepository = require('../../../shared/base.repository');
const Payment = require('./payment.model');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }
  // Add custom repository methods if needed
}

module.exports = new PaymentRepository();

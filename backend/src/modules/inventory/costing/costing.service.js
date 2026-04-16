const fifoService = require('./fifo.service');
const lifoService = require('./lifo.service');

/**
 * ✅ COSTING STRATEGY ENGINE
 * 
 * Routes costing calculations to appropriate method:
 * - FIFO (First In First Out)
 * - LIFO (Last In First Out)
 * 
 * Provides unified interface for cost calculation
 */
class CostingService {
  /**
   * Calculate cost using specified costing method
   * 
   * @param {String} method - Costing method ("FIFO" or "LIFO")
   * @param {Object} data - Calculation parameters
   * @param {ObjectId} data.tenantId - Tenant ID
   * @param {ObjectId} data.itemId - Item ID
   * @param {ObjectId} data.warehouseId - Warehouse ID
   * @param {Number} data.qty - Quantity to consume
   * 
   * @returns {Object} { totalCost, unitCost, breakdown, method }
   * 
   * @throws Error if method is unsupported or calculation fails
   */
  async calculateCost(method = 'FIFO', data) {
    console.log(`\n🎯 COSTING ENGINE: Method=${method}, Qty=${data.qty}`);

    // Validate method
    const supportedMethods = ['FIFO', 'LIFO'];
    if (!supportedMethods.includes(method)) {
      throw new Error(
        `Costing method '${method}' not supported. Use: ${supportedMethods.join(', ')}`
      );
    }

    // Validate data
    if (!data || !data.tenantId || !data.itemId || !data.warehouseId || !data.qty) {
      throw new Error('Missing required parameters for costing calculation');
    }

    try {
      // Route to appropriate costing method
      let result;

      if (method === 'FIFO') {
        console.log('  🔵 Routing to FIFO service');
        result = await fifoService.calculateFIFO(data);
      } else if (method === 'LIFO') {
        console.log('  🔷 Routing to LIFO service');
        result = await lifoService.calculateLIFO(data);
      }

      console.log(`  ✅ Costing complete: ${method} method, Cost=${result.totalCost}`);
      return result;
    } catch (error) {
      console.error(`  ❌ Costing calculation failed (${method}): ${error.message}`);
      throw error;
    }
  }

  /**
   * Get list of available costing methods
   * 
   * @returns {Array<String>} List of supported methods
   */
  getSupportedMethods() {
    return ['FIFO', 'LIFO'];
  }

  /**
   * Get default costing method
   * 
   * @returns {String} Default method
   */
  getDefaultMethod() {
    return 'FIFO'; // FIFO is the default/standard
  }
}

module.exports = new CostingService();

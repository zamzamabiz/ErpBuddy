class ReportsService {
  async dashboard() {
    // Placeholder: implement dashboard summary aggregation
    return {
      salesCount: 0,
      purchaseCount: 0,
      inventoryCount: 0,
      customerCount: 0,
      itemCount: 0,
      paymentCount: 0,
      totalSales: 0,
      totalPurchases: 0,
      totalReceipts: 0,
      totalPayments: 0
    };
  }
}

module.exports = new ReportsService();

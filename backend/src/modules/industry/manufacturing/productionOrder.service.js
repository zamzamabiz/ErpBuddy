const BaseService = require('../../../shared/base.service');
const ProductionOrderRepository = require('./productionOrder.repository');


// Engine imports
const InventoryTransactionService = require('../../engines/inventoryEngine/inventoryTransaction.service');
const JournalEntryService = require('../../engines/accountingEngine/journalEntry.service');
const AuditLogService = require('../../../services/auditLog.service');
const ProductionOrder = require('./productionOrder.model');
const BOM = require('./bom.model');

class ProductionOrderService extends BaseService {
  constructor() {
    super(ProductionOrderRepository);
  }

  // Production posting logic
  async postProductionOrder(id, user) {
    // 1. Fetch production order
    const prodOrder = await ProductionOrder.findById(id).lean();
    if (!prodOrder) throw new Error('Production order not found');
    if (prodOrder.status === 'Completed') throw new Error('Production order already posted');
    if (prodOrder.status === 'Cancelled') throw new Error('Production order is cancelled');

    // 2. Fetch BOM for cost reference (optional, can use prodOrder.materials)
    // const bom = await BOM.findById(prodOrder.bom).lean();

    // 3. Inventory: Issue materials from WIP warehouse
    let totalMaterialCost = 0;
    for (const mat of prodOrder.materials) {
      // For simplicity, use costPrice from Item (could be improved with FIFO/Avg)
      const item = await require('../../masters/item/item.model').findById(mat.item).lean();
      const unitCost = item ? (item.costPrice || item.purchasePrice || 0) : 0;
      const totalCost = unitCost * mat.quantity;
      totalMaterialCost += totalCost;
      await InventoryTransactionService.repository.create({
        company: prodOrder.companyId,
        item: mat.item,
        warehouse: prodOrder.wipWarehouse,
        transactionType: 'Production',
        quantityIn: 0,
        quantityOut: mat.quantity,
        unitCost,
        totalCost,
        transactionDate: prodOrder.productionDate,
        createdBy: user._id,
      });
    }

    // 4. Inventory: Receive outputs to FG warehouse (cost split equally or by ratio)
    let totalOutputQty = prodOrder.outputs.reduce((sum, o) => sum + o.quantity, 0);
    let outputCostPerUnit = totalOutputQty > 0 ? totalMaterialCost / totalOutputQty : 0;
    for (const out of prodOrder.outputs) {
      await InventoryTransactionService.repository.create({
        company: prodOrder.companyId,
        item: out.item,
        warehouse: prodOrder.fgWarehouse,
        transactionType: 'Production',
        quantityIn: out.quantity,
        quantityOut: 0,
        unitCost: outputCostPerUnit,
        totalCost: outputCostPerUnit * out.quantity,
        transactionDate: prodOrder.productionDate,
        createdBy: user._id,
      });
    }

    // 5. Accounting: Create journal entry (Debit FG Inv, Credit WIP Inv)
    // For simplicity, assume account codes are configured elsewhere (could be extended)
    // Find FG and WIP inventory accounts (should be set in ChartOfAccounts)
    const ChartOfAccounts = require('../../masters/chartOfAccounts/chartOfAccounts.model');
    const fgAccount = await ChartOfAccounts.findOne({ company: prodOrder.companyId, accountTitle: /finished goods/i });
    const wipAccount = await ChartOfAccounts.findOne({ company: prodOrder.companyId, accountTitle: /work in process|wip/i });
    if (!fgAccount || !wipAccount) throw new Error('FG or WIP inventory account not found');

    const journalLines = [
      { account: fgAccount._id, debit: totalMaterialCost, credit: 0, description: 'Production output' },
      { account: wipAccount._id, debit: 0, credit: totalMaterialCost, description: 'Materials consumed' },
    ];
    await JournalEntryService.repository.create({
      company: prodOrder.companyId,
      journalNumber: 'AUTO', // Should use number series
      journalDate: prodOrder.productionDate,
      referenceNumber: prodOrder.productionNumber,
      description: `Production posting for ${prodOrder.productionNumber}`,
      totalDebit: totalMaterialCost,
      totalCredit: totalMaterialCost,
      status: 'Posted',
      lines: journalLines,
      createdBy: user._id,
    });

    // 6. Update production order
    await ProductionOrder.findByIdAndUpdate(id, {
      status: 'Completed',
      totalCost: totalMaterialCost,
      updatedBy: user._id,
    });

    // 7. Audit log
    await AuditLogService.log({
      action: 'POST',
      userId: user._id,
      entity: 'ProductionOrder',
      entityId: id,
      details: { productionNumber: prodOrder.productionNumber, totalCost: totalMaterialCost },
    });

    return { message: 'Production order posted successfully', totalCost: totalMaterialCost };
  }
}

module.exports = new ProductionOrderService();

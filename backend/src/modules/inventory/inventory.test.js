const request = require('supertest');
const app = require('@/app');
const Tenant = require('@modules/tenant/tenant.model');
const Category = require('@modules/category/category.model');
const Brand = require('@modules/brand/brand.model');
const Item = require('@modules/item/item.model');
const Inventory = require('./inventory.model');
const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');

let tenantId1, tenantId2, itemId1, itemId2, categoryId, brandId;
const timestamp = new Date().getTime();

describe('Inventory Module Tests', () => {
  beforeAll(async () => {
    // Clean up
    await Inventory.deleteMany({});
    await Item.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Tenant.deleteMany({});

    // Create tenants
    const tenant1 = await Tenant.create({ name: `Tenant-${timestamp}-1` });
    const tenant2 = await Tenant.create({ name: `Tenant-${timestamp}-2` });
    tenantId1 = tenant1._id.toString();
    tenantId2 = tenant2._id.toString();

    // Create category for tenant 1
    const category = await Category.create({
      tenantId: tenantId1,
      name: `Category-${timestamp}`,
      level: 1,
    });
    categoryId = category._id.toString();

    // Create brand for tenant 1
    const brand = await Brand.create({
      tenantId: tenantId1,
      name: `Brand-${timestamp}`,
      status: 'LOCAL',
    });
    brandId = brand._id.toString();

    // Create items for tenant 1
    const item1 = await Item.create({
      tenantId: tenantId1,
      name: `Item-${timestamp}-1`,
      sku: `SKU-${timestamp}-1`,
      categoryId,
      brandId,
      unit: 'PIECE',
      purchasePrice: 100,
      salePrice: 150,
    });
    itemId1 = item1._id.toString();

    const item2 = await Item.create({
      tenantId: tenantId1,
      name: `Item-${timestamp}-2`,
      sku: `SKU-${timestamp}-2`,
      categoryId,
      brandId,
      unit: 'KG',
      purchasePrice: 50,
      salePrice: 75,
    });
    itemId2 = item2._id.toString();
  });

  afterAll(async () => {
    await Inventory.deleteMany({});
    await Item.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Tenant.deleteMany({});
  });

  describe('1. Create Inventory Entry - IN Transaction', () => {
    it('✓ Should create IN entry with valid data', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 100,
          unit: 'PIECE',
          transactionType: 'IN',
          referenceType: 'PURCHASE',
          referenceId: 'PO-001',
          date: new Date(),
          notes: 'Purchase order',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.transactionType).toBe('IN');
      expect(response.body.data.quantity).toBe(100);
    });

    it('✓ Should create IN entry with batch', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          batchNo: 'BATCH-001',
          quantity: 50,
          unit: 'PIECE',
          transactionType: 'IN',
          referenceType: 'PURCHASE',
          date: new Date(),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.batchNo).toBe('BATCH-001');
    });
  });

  describe('2. Create Inventory Entry - OUT Transaction', () => {
    it('✓ Should create OUT entry', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 30,
          unit: 'PIECE',
          transactionType: 'OUT',
          referenceType: 'SALE',
          referenceId: 'INV-001',
          date: new Date(),
          notes: 'Sales invoice',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.transactionType).toBe('OUT');
      expect(response.body.data.quantity).toBe(30);
    });
  });

  describe('3. Create Inventory Entry - ADJUST Transaction', () => {
    it('✓ Should create ADJUST entry (positive correction)', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 5,
          unit: 'PIECE',
          transactionType: 'ADJUST',
          referenceType: 'ADJUSTMENT',
          date: new Date(),
          notes: 'Physical count adjustment',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.transactionType).toBe('ADJUST');
    });
  });

  describe('4. Stock Calculation - GET Stock', () => {
    beforeAll(async () => {
      // Create fresh entries for testing
      await Inventory.deleteMany({ itemId: itemId2 });

      // 100 IN
      await Inventory.create({
        itemId: itemId2,
        quantity: 100,
        unit: 'KG',
        transactionType: 'IN',
        referenceType: 'PURCHASE',
        tenantId: tenantId1,
      });

      // 30 OUT
      await Inventory.create({
        itemId: itemId2,
        quantity: 30,
        unit: 'KG',
        transactionType: 'OUT',
        referenceType: 'SALE',
        tenantId: tenantId1,
      });

      // 5 ADJUST
      await Inventory.create({
        itemId: itemId2,
        quantity: 5,
        unit: 'KG',
        transactionType: 'ADJUST',
        referenceType: 'ADJUSTMENT',
        tenantId: tenantId1,
      });
    });

    it('✓ Should calculate stock correctly (100 - 30 + 5 = 75)', async () => {
      const response = await request(app)
        .get(`/api/inventory/stock/${itemId2}`)
        .set('x-tenant-id', tenantId1);

      expect(response.status).toBe(200);
      expect(response.body.data.currentStock).toBe(75);
      expect(response.body.data.totalMovements).toBe(3);
    });

    it('✓ Should return item name and unit', async () => {
      const response = await request(app)
        .get(`/api/inventory/stock/${itemId2}`)
        .set('x-tenant-id', tenantId1);

      expect(response.status).toBe(200);
      expect(response.body.data.itemName).toBeTruthy();
      expect(response.body.data.unit).toBe('KG');
    });
  });

  describe('5. Multi-Tenant Isolation', () => {
    it('✓ Should not allow tenant 2 to see tenant 1 stock', async () => {
      const response = await request(app)
        .get(`/api/inventory/stock/${itemId1}`)
        .set('x-tenant-id', tenantId2);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid item');
    });

    it('✗ Should block create with invalid item for tenant', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId2)
        .send({
          itemId: itemId1,
          quantity: 50,
          unit: 'PIECE',
          transactionType: 'IN',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid item');
    });
  });

  describe('6. Batch Stock Tracking', () => {
    beforeAll(async () => {
      await Inventory.deleteMany({ itemId: itemId1, batchNo: 'BATCH-TEST-001' });
      await Inventory.deleteMany({ itemId: itemId1, batchNo: 'BATCH-TEST-002' });

      // Batch 1: 50 IN, 10 OUT = 40
      await Inventory.create({
        itemId: itemId1,
        batchNo: 'BATCH-TEST-001',
        quantity: 50,
        unit: 'PIECE',
        transactionType: 'IN',
        tenantId: tenantId1,
      });

      await Inventory.create({
        itemId: itemId1,
        batchNo: 'BATCH-TEST-001',
        quantity: 10,
        unit: 'PIECE',
        transactionType: 'OUT',
        tenantId: tenantId1,
      });

      // Batch 2: 30 IN, 5 OUT = 25
      await Inventory.create({
        itemId: itemId1,
        batchNo: 'BATCH-TEST-002',
        quantity: 30,
        unit: 'PIECE',
        transactionType: 'IN',
        tenantId: tenantId1,
      });

      await Inventory.create({
        itemId: itemId1,
        batchNo: 'BATCH-TEST-002',
        quantity: 5,
        unit: 'PIECE',
        transactionType: 'OUT',
        tenantId: tenantId1,
      });
    });

    it('✓ Should return batch 1 stock = 40', async () => {
      const response = await request(app)
        .get(`/api/inventory/stock/${itemId1}/batch/BATCH-TEST-001`)
        .set('x-tenant-id', tenantId1);

      expect(response.status).toBe(200);
      expect(response.body.data.batchStock).toBe(40);
      expect(response.body.data.batchNo).toBe('BATCH-TEST-001');
    });

    it('✓ Should return batch 2 stock = 25', async () => {
      const response = await request(app)
        .get(`/api/inventory/stock/${itemId1}/batch/BATCH-TEST-002`)
        .set('x-tenant-id', tenantId1);

      expect(response.status).toBe(200);
      expect(response.body.data.batchStock).toBe(25);
    });
  });

  describe('7. Inventory Ledger - Movement History', () => {
    it('✓ Should return ledger with running balance', async () => {
      const response = await request(app)
        .get(`/api/inventory/ledger/${itemId2}`)
        .set('x-tenant-id', tenantId1);

      expect(response.status).toBe(200);
      expect(response.body.data.ledger).toHaveLength(3);
      expect(response.body.data.finalStock).toBe(75);
    });

    it('✓ Ledger should include running balance per entry', async () => {
      const response = await request(app)
        .get(`/api/inventory/ledger/${itemId2}`)
        .set('x-tenant-id', tenantId1);

      const ledger = response.body.data.ledger;
      expect(ledger[0].balance).toBe(100); // First IN
      expect(ledger[1].balance).toBe(70); // After OUT
      expect(ledger[2].balance).toBe(75); // After ADJUST
    });

    it('✓ Ledger should be ordered by date ascending', async () => {
      const response = await request(app)
        .get(`/api/inventory/ledger/${itemId2}`)
        .set('x-tenant-id', tenantId1);

      const ledger = response.body.data.ledger;
      for (let i = 1; i < ledger.length; i++) {
        const prevDate = new Date(ledger[i - 1].date);
        const currDate = new Date(ledger[i].date);
        expect(prevDate <= currDate).toBe(true);
      }
    });
  });

  describe('8. Available Batches - For Invoice Selection', () => {
    it('✓ Should return all batches with positive stock', async () => {
      const response = await request(app)
        .get(`/api/inventory/batches/${itemId1}`)
        .set('x-tenant-id', tenantId1);

      expect(response.status).toBe(200);
      expect(response.body.data.batches).toHaveLength(2);
      expect(response.body.data.totalBatches).toBe(2);
    });

    it('✓ Batch list should not include zero-stock batches', async () => {
      // Create batch with all OUT
      await Inventory.create({
        itemId: itemId1,
        batchNo: 'BATCH-EMPTY',
        quantity: 100,
        unit: 'PIECE',
        transactionType: 'IN',
        tenantId: tenantId1,
      });

      await Inventory.create({
        itemId: itemId1,
        batchNo: 'BATCH-EMPTY',
        quantity: 100,
        unit: 'PIECE',
        transactionType: 'OUT',
        tenantId: tenantId1,
      });

      const response = await request(app)
        .get(`/api/inventory/batches/${itemId1}`)
        .set('x-tenant-id', tenantId1);

      const emptyBatch = response.body.data.batches.find(
        (b) => b.batchNo === 'BATCH-EMPTY'
      );
      expect(emptyBatch).toBeUndefined();
    });
  });

  describe('9. Validation - Missing Required Fields', () => {
    it('✗ Should reject without quantity', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          unit: 'PIECE',
          transactionType: 'IN',
        });

      expect([400, 422]).toContain(response.status);
      expect(response.body.message).toBeTruthy();
    });

    it('✗ Should reject with quantity <= 0', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: -10,
          unit: 'PIECE',
          transactionType: 'IN',
        });

      expect([400, 422]).toContain(response.status);
    });

    it('✗ Should reject without unit', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 100,
          transactionType: 'IN',
        });

      expect([400, 422]).toContain(response.status);
    });

    it('✗ Should reject without transactionType', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 100,
          unit: 'PIECE',
        });

      expect([400, 422]).toContain(response.status);
    });

    it('✗ Should reject invalid transactionType', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 100,
          unit: 'PIECE',
          transactionType: 'INVALID',
        });

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('10. Validation - Unit Mismatch', () => {
    it('✗ Should reject if unit does not match item unit', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 100,
          unit: 'KG', // Item is PIECE
          transactionType: 'IN',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Unit mismatch');
    });
  });

  describe('11. Validation - Missing Tenant Header', () => {
    it('✗ Should reject without x-tenant-id header', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .send({
          itemId: itemId1,
          quantity: 100,
          unit: 'PIECE',
          transactionType: 'IN',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Tenant ID');
    });
  });

  describe('12. Edge Cases', () => {
    it('✓ Should handle zero batch stock correctly', async () => {
      const response = await request(app)
        .get(`/api/inventory/stock/${itemId1}/batch/NONEXISTENT`)
        .set('x-tenant-id', tenantId1);

      expect(response.status).toBe(200);
      expect(response.body.data.batchStock).toBe(0);
    });

    it('✓ Should allow optional referenceType and referenceId', async () => {
      const response = await request(app)
        .post('/api/inventory')
        .set('x-tenant-id', tenantId1)
        .send({
          itemId: itemId1,
          quantity: 20,
          unit: 'PIECE',
          transactionType: 'IN',
          // referenceType and referenceId omitted
        });

      expect(response.status).toBe(201);
      expect(response.body.data.referenceType).toBeNull();
      expect(response.body.data.referenceId).toBeNull();
    });
  });
});

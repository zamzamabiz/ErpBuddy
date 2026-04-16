const request = require('supertest');
const app = require('@/app');
const Tenant = require('@modules/tenant/tenant.model');
const Category = require('@modules/category/category.model');
const Brand = require('@modules/brand/brand.model');
const Item = require('@modules/item/item.model');
const Inventory = require('@modules/inventory/inventory.model');
const Invoice = require('./invoice.model');

let tenantId, itemId1, itemId2, categoryId, brandId, invoiceId;
const timestamp = new Date().getTime();

describe('Invoice Module - Sales + Purchase Invoice Engine', () => {
  beforeAll(async () => {
    // Clean up
    await Invoice.deleteMany({});
    await Inventory.deleteMany({});
    await Item.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Tenant.deleteMany({});

    // Create tenant
    const tenant = await Tenant.create({ name: `Tenant-${timestamp}` });
    tenantId = tenant._id.toString();

    // Create category
    const category = await Category.create({
      tenantId,
      name: `Category-${timestamp}`,
      level: 1,
    });
    categoryId = category._id.toString();

    // Create brand
    const brand = await Brand.create({
      tenantId,
      name: `Brand-${timestamp}`,
      status: 'LOCAL',
    });
    brandId = brand._id.toString();

    // Create items
    const item1 = await Item.create({
      tenantId,
      name: `Item-${timestamp}-1`,
      sku: `SKU-${timestamp}-1`,
      categoryId,
      brandId,
      unit: 'PIECE',
      purchasePrice: 1000,
      salePrice: 2800,
    });
    itemId1 = item1._id.toString();

    const item2 = await Item.create({
      tenantId,
      name: `Item-${timestamp}-2`,
      sku: `SKU-${timestamp}-2`,
      categoryId,
      brandId,
      unit: 'PIECE',
      purchasePrice: 500,
      salePrice: 1200,
    });
    itemId2 = item2._id.toString();

    // Create stock for items
    await Inventory.create({
      itemId: itemId1,
      quantity: 100,
      unit: 'PIECE',
      transactionType: 'IN',
      referenceType: 'OPENING',
      tenantId,
    });

    await Inventory.create({
      itemId: itemId2,
      quantity: 50,
      unit: 'PIECE',
      transactionType: 'IN',
      referenceType: 'OPENING',
      tenantId,
    });
  });

  afterAll(async () => {
    await Invoice.deleteMany({});
    await Inventory.deleteMany({});
    await Item.deleteMany({});
    await Brand.deleteMany({});
    await Category.deleteMany({});
    await Tenant.deleteMany({});
  });

  describe('1. Create SALE Invoice (DRAFT)', () => {
    it('✓ Should create SALE invoice with valid items', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer A',
          items: [
            {
              itemId: itemId1,
              quantity: 10,
              unit: 'PIECE',
              rate: 2800,
            },
            {
              itemId: itemId2,
              quantity: 5,
              unit: 'PIECE',
              rate: 1200,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('_id');
      expect(response.body.data.invoiceNumber).toMatch(/^SALE-\d{4}$/);
      expect(response.body.data.type).toBe('SALE');
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.subtotal).toBe(10 * 2800 + 5 * 1200); // 34000
      expect(response.body.data.total).toBe(34000);

      invoiceId = response.body.data._id;
    });

    it('✓ Should auto-increment invoice number', async () => {
      const response1 = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer B',
          items: [
            {
              itemId: itemId1,
              quantity: 5,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      expect(response1.body.data.invoiceNumber).toBe('SALE-0002');

      const response2 = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer C',
          items: [
            {
              itemId: itemId2,
              quantity: 3,
              unit: 'PIECE',
              rate: 1200,
            },
          ],
        });

      expect(response2.body.data.invoiceNumber).toBe('SALE-0003');
    });
  });

  describe('2. Create PURCHASE Invoice (DRAFT)', () => {
    it('✓ Should create PURCHASE invoice with valid items', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'PURCHASE',
          partyName: 'Supplier X',
          items: [
            {
              itemId: itemId1,
              quantity: 50,
              unit: 'PIECE',
              rate: 1000,
            },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.invoiceNumber).toMatch(/^PURCHASE-\d{4}$/);
      expect(response.body.data.type).toBe('PURCHASE');
      expect(response.body.data.status).toBe('DRAFT');
      expect(response.body.data.subtotal).toBe(50 * 1000); // 50000
    });
  });

  describe('3. POST Invoice - SALE (Inventory Integration)', () => {
    it('✓ Should post SALE invoice and create OUT inventory entries', async () => {
      // Create SALE invoice
      const createResp = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer Test',
          items: [
            {
              itemId: itemId1,
              quantity: 20,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      const invoiceDraftId = createResp.body.data._id;

      // Post invoice
      const postResp = await request(app)
        .post(`/api/invoices/${invoiceDraftId}/post`)
        .set('x-tenant-id', tenantId)
        .send({});

      expect(postResp.status).toBe(200);
      expect(postResp.body.data.status).toBe('POSTED');

      // Verify inventory entry was created
      const invEntry = await Inventory.findOne({
        referenceId: invoiceDraftId.toString(),
        transactionType: 'OUT',
      });

      expect(invEntry).toBeTruthy();
      expect(invEntry.referenceType).toBe('SALE');
      expect(invEntry.quantity).toBe(20);
    });

    it('✓ Should verify stock is reduced after SALE post', async () => {
      // Get current stock before
      const resp1 = await request(app)
        .get(`/api/inventory/stock/${itemId1}`)
        .set('x-tenant-id', tenantId);
      const stockBefore = resp1.body.data.currentStock;

      // Create and post SALE invoice
      const createResp = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer Test 2',
          items: [
            {
              itemId: itemId1,
              quantity: 15,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      await request(app)
        .post(`/api/invoices/${createResp.body.data._id}/post`)
        .set('x-tenant-id', tenantId)
        .send({});

      // Get stock after
      const resp2 = await request(app)
        .get(`/api/inventory/stock/${itemId1}`)
        .set('x-tenant-id', tenantId);
      const stockAfter = resp2.body.data.currentStock;

      expect(stockAfter).toBe(stockBefore - 15);
    });

    it('✗ Should reject SALE post if insufficient stock', async () => {
      // Try to sell 1000 of item when only 100 available
      const createResp = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer Fail',
          items: [
            {
              itemId: itemId1,
              quantity: 1000,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      const postResp = await request(app)
        .post(`/api/invoices/${createResp.body.data._id}/post`)
        .set('x-tenant-id', tenantId)
        .send({});

      expect(postResp.status).toBe(400);
      expect(postResp.body.message).toContain('Insufficient stock');
    });
  });

  describe('4. POST Invoice - PURCHASE (Inventory Integration)', () => {
    it('✓ Should post PURCHASE invoice and create IN inventory entries', async () => {
      // Get current stock before
      const resp1 = await request(app)
        .get(`/api/inventory/stock/${itemId2}`)
        .set('x-tenant-id', tenantId);
      const stockBefore = resp1.body.data.currentStock;

      // Create PURCHASE invoice
      const createResp = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'PURCHASE',
          partyName: 'Supplier Y',
          items: [
            {
              itemId: itemId2,
              quantity: 30,
              unit: 'PIECE',
              rate: 500,
            },
          ],
        });

      // Post invoice
      const postResp = await request(app)
        .post(`/api/invoices/${createResp.body.data._id}/post`)
        .set('x-tenant-id', tenantId)
        .send({});

      expect(postResp.status).toBe(200);
      expect(postResp.body.data.status).toBe('POSTED');

      // Verify inventory entry was created
      const invEntry = await Inventory.findOne({
        referenceId: createResp.body.data._id.toString(),
        transactionType: 'IN',
      });

      expect(invEntry).toBeTruthy();
      expect(invEntry.referenceType).toBe('PURCHASE');
      expect(invEntry.quantity).toBe(30);

      // Verify stock increased
      const resp2 = await request(app)
        .get(`/api/inventory/stock/${itemId2}`)
        .set('x-tenant-id', tenantId);
      const stockAfter = resp2.body.data.currentStock;

      expect(stockAfter).toBe(stockBefore + 30);
    });
  });

  describe('5. Prevent Double Posting', () => {
    it('✗ Should prevent posting same invoice twice', async () => {
      // Create invoice
      const createResp = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer Double',
          items: [
            {
              itemId: itemId1,
              quantity: 5,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      const id = createResp.body.data._id;

      // Post first time
      const postResp1 = await request(app)
        .post(`/api/invoices/${id}/post`)
        .set('x-tenant-id', tenantId)
        .send({});

      expect(postResp1.status).toBe(200);

      // Try to post again
      const postResp2 = await request(app)
        .post(`/api/invoices/${id}/post`)
        .set('x-tenant-id', tenantId)
        .send({});

      expect(postResp2.status).toBe(400);
      expect(postResp2.body.message).toContain('already posted');
    });
  });

  describe('6. Validation - Missing Required Fields', () => {
    it('✗ Should reject without type', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          partyName: 'Customer',
          items: [
            {
              itemId: itemId1,
              quantity: 10,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('✗ Should reject without partyName', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          items: [
            {
              itemId: itemId1,
              quantity: 10,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('✗ Should reject with empty items', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer',
          items: [],
        });

      expect(response.status).toBe(400);
    });

    it('✗ Should reject with negative quantity', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer',
          items: [
            {
              itemId: itemId1,
              quantity: -10,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('✗ Should reject with negative rate', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer',
          items: [
            {
              itemId: itemId1,
              quantity: 10,
              unit: 'PIECE',
              rate: -2800,
            },
          ],
        });

      expect(response.status).toBe(400);
    });

    it('✗ Should reject with invalid item', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .set('x-tenant-id', tenantId)
        .send({
          type: 'SALE',
          partyName: 'Customer',
          items: [
            {
              itemId: '000000000000000000000000',
              quantity: 10,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('7. GET Invoices (List)', () => {
    it('✓ Should get all invoices for tenant', async () => {
      const response = await request(app)
        .get('/api/invoices')
        .set('x-tenant-id', tenantId);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(response.body.count);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('✓ Should filter invoices by type=SALE', async () => {
      const response = await request(app)
        .get('/api/invoices?type=SALE')
        .set('x-tenant-id', tenantId);

      expect(response.status).toBe(200);
      response.body.data.forEach((inv) => {
        expect(inv.type).toBe('SALE');
      });
    });

    it('✓ Should filter invoices by type=PURCHASE', async () => {
      const response = await request(app)
        .get('/api/invoices?type=PURCHASE')
        .set('x-tenant-id', tenantId);

      expect(response.status).toBe(200);
      response.body.data.forEach((inv) => {
        expect(inv.type).toBe('PURCHASE');
      });
    });

    it('✓ Should filter invoices by status=DRAFT', async () => {
      const response = await request(app)
        .get('/api/invoices?status=DRAFT')
        .set('x-tenant-id', tenantId);

      expect(response.status).toBe(200);
      response.body.data.forEach((inv) => {
        expect(inv.status).toBe('DRAFT');
      });
    });

    it('✓ Should filter invoices by status=POSTED', async () => {
      const response = await request(app)
        .get('/api/invoices?status=POSTED')
        .set('x-tenant-id', tenantId);

      expect(response.status).toBe(200);
      response.body.data.forEach((inv) => {
        expect(inv.status).toBe('POSTED');
      });
    });
  });

  describe('8. GET Invoice by ID', () => {
    it('✓ Should get invoice by ID', async () => {
      const response = await request(app)
        .get(`/api/invoices/${invoiceId}`)
        .set('x-tenant-id', tenantId);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(invoiceId);
    });

    it('✗ Should return not found for invalid ID', async () => {
      const response = await request(app)
        .get('/api/invoices/000000000000000000000000')
        .set('x-tenant-id', tenantId);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('9. Multi-Tenant Isolation', () => {
    it('✓ Should not allow other tenant to see invoices', async () => {
      // Create another tenant
      const tenant2 = await Tenant.create({ name: `Tenant-${timestamp}-2` });
      const tenantId2 = tenant2._id.toString();

      const response = await request(app)
        .get('/api/invoices')
        .set('x-tenant-id', tenantId2);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
    });
  });

  describe('10. Missing Tenant Header', () => {
    it('✗ Should reject without x-tenant-id header', async () => {
      const response = await request(app)
        .post('/api/invoices')
        .send({
          type: 'SALE',
          partyName: 'Customer',
          items: [
            {
              itemId: itemId1,
              quantity: 10,
              unit: 'PIECE',
              rate: 2800,
            },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Tenant ID');
    });
  });
});

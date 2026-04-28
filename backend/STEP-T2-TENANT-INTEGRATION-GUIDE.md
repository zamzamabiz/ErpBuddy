# STEP T2: TENANT CONTEXT INTEGRATION GUIDE

## Overview
The tenant middleware now extracts `tenantId` from JWT tokens and attaches it to every request. All protected routes automatically enforce multi-tenant isolation.

---

## Architecture

### Flow
```
User Login → JWT with tenantId
    ↓
Protected Route Called
    ↓
Tenant Middleware Extracts tenantId from JWT/Header
    ↓
req.tenantId = tenantId (attached to request)
    ↓
Service uses req.tenantId for all database queries
    ↓
Only tenant-specific data returned
```

---

## Files Created/Updated

| File | Purpose |
|------|---------|
| `middleware/tenant.middleware.js` | ✅ Extracts tenantId from JWT, validates, attaches to req |
| `routes/index.js` | ✅ Applies tenant middleware to all protected routes |
| `utils/tenantContext.js` | ✅ Helper functions for tenant-aware queries |

---

## How to Use in Services

### Pattern 1: Simple Query with Tenant Filter
```javascript
const { getTenantQuery } = require('../utils/tenantContext');

async function getCustomers(req) {
  // req.tenantId automatically set by middleware
  const query = getTenantQuery(req.tenantId);
  const customers = await Customer.find(query);
  return customers;
}
```

### Pattern 2: Complex Query with Tenant Filter
```javascript
const { getTenantQuery } = require('../utils/tenantContext');

async function getActiveCustomers(req) {
  const baseQuery = { isActive: true, status: 'approved' };
  const query = getTenantQuery(req.tenantId, baseQuery);
  const customers = await Customer.find(query);
  return customers;
}
```

### Pattern 3: Validate Access to Resource
```javascript
const { getTenantFromRequest, validateTenantAccess } = require('../utils/tenantContext');

async function getCustomerDetail(req, customerId) {
  const tenantId = getTenantFromRequest(req);
  const customer = await Customer.findById(customerId);
  
  // Verify customer belongs to this tenant
  if (!validateTenantAccess(customer, tenantId)) {
    throw new Error('Access denied: Customer not found in your tenant');
  }
  
  return customer;
}
```

---

## Current Implementation Status

### ✅ Completed
- Tenant Middleware: Extracts tenantId from JWT
- Route Integration: Applied to all protected routes
- Header Support: Falls back to x-tenant-id header
- Validation: Validates tenantId format (MongoDB ObjectId)
- Error Handling: Clear error messages for missing/invalid tenantId

### ⚠️ Next: STEP T3 (Query Audit)
Services need to be updated to use `getTenantQuery()` helper in all database queries.
This ensures no queries run without tenant context.

---

## Testing

### Test 1: Login and Extract Token
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@erpbuddy.com", "password": "password123"}'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGc..."
  }
}
```

JWT will contain:
```json
{
  "userId": "...",
  "email": "admin@erpbuddy.com",
  "tenantId": "69dd0cb31c5468a5b63511b7",
  "companyId": "69dd0cb31c5468a5b63511b7"
}
```

### Test 2: Call Protected Route WITH Token
```bash
curl -X GET http://localhost:5000/api/accounts \
  -H "Authorization: Bearer <TOKEN_HERE>" \
  -H "Content-Type: application/json"
```

**Expected:** Returns tenant-specific accounts

### Test 3: Call Protected Route WITHOUT Token
```bash
curl -X GET http://localhost:5000/api/accounts \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Access denied. Tenant ID required. Please provide valid JWT token or x-tenant-id header."
}
```

---

## Security Rules (NON-NEGOTIABLE)

1. ✅ **Tenant Middleware Applied First** - Before any business logic
2. ✅ **TenantId Validation** - Must be valid MongoDB ObjectId
3. ✅ **All Queries Filtered by TenantId** - Use getTenantQuery() helper
4. ✅ **Resource Access Validation** - Use validateTenantAccess() before returning data
5. ✅ **Error Handling** - Clear separation of auth vs authorization errors

---

## Acceptance Criteria for STEP T2

- [x] TenantId extracted from JWT token
- [x] TenantId attached to req object
- [x] Middleware applied to all protected routes
- [x] TenantId format validation (ObjectId)
- [x] Helper functions created for services
- [ ] All services updated to use getTenantQuery() (STEP T3)
- [ ] Query audit completed (STEP T3)

---

## Next Step: STEP T3 (Isolation Check)

Audit all database queries to ensure:
1. All Model.find() calls include tenantId filter
2. All Model.findOne() calls include tenantId filter
3. No queries can run without tenant context
4. Cross-tenant data access is impossible

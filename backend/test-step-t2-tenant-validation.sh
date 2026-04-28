#!/bin/bash

# STEP T2 — USER MAPPING & TENANT CONTEXT VALIDATION
# Script to verify tenant middleware is working correctly

echo "🔍 STEP T2: Validating Tenant Context Middleware"
echo "=================================================="
echo ""

# Test 1: Login and get token
echo "TEST 1: Login user and extract tenantId from JWT"
echo "-----------------------------------------------"

curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@erpbuddy.com",
    "password": "password123"
  }' > /tmp/login_response.json

TOKEN=$(grep -o '"token":"[^"]*' /tmp/login_response.json | cut -d'"' -f4)
TENANT_ID=$(grep -o '"tenantId":"[^"]*' /tmp/login_response.json | cut -d'"' -f4)

echo "Token: $TOKEN"
echo "TenantId in JWT: $TENANT_ID"
echo ""

# Test 2: Call protected endpoint WITH token
echo "TEST 2: Call protected endpoint WITH tenant context (Bearer token)"
echo "-----------------------------------------------"

curl -X GET http://localhost:5000/api/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

echo ""
echo ""

# Test 3: Call protected endpoint WITHOUT token (should fail)
echo "TEST 3: Call protected endpoint WITHOUT token (should return 403)"
echo "-----------------------------------------------"

curl -X GET http://localhost:5000/api/accounts \
  -H "Content-Type: application/json"

echo ""
echo ""

# Test 4: Call protected endpoint WITH header
echo "TEST 4: Call protected endpoint WITH x-tenant-id header (should work)"
echo "-----------------------------------------------"

curl -X GET http://localhost:5000/api/accounts \
  -H "x-tenant-id: $TENANT_ID" \
  -H "Content-Type: application/json"

echo ""
echo ""

echo "✅ STEP T2 VALIDATION COMPLETE"

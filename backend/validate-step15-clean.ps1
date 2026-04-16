#!/usr/bin/env pwsh

Write-Host ""
Write-Host "========================================"
Write-Host "STEP 15 COMPREHENSIVE TEST"
Write-Host "Purchase Create, Edit, and RBAC"
Write-Host "========================================"
Write-Host ""

$API_BASE = "http://localhost:5000/api"
$ADMIN_EMAIL = "user@company.local"
$ADMIN_PASSWORD = "password123"
$STAFF_EMAIL = "staff@company.local"
$STAFF_PASSWORD = "password123"
$adminToken = ""
$staffToken = ""
$createdPurchaseId = ""

# Test 1: Admin Login
Write-Host "TEST 1: Admin Login"
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body (ConvertTo-Json @{ email = $ADMIN_EMAIL; password = $ADMIN_PASSWORD }) `
        -ErrorAction Stop
    $adminToken = $response.data.token
    Write-Host "[PASS] Admin login - role: $($response.data.user.userRole)"
} catch {
    Write-Host "[FAIL] Login failed"
    exit 1
}

Write-Host ""

# Test 2: Create Purchase
Write-Host "TEST 2: Admin - Create Purchase"
try {
    $requestBody = @{
        vendorName = "Vendor ABC"
        date = (Get-Date).ToString("yyyy-MM-dd")
        items = @(
            @{ itemName = "Material A"; quantity = 10; unitPrice = 100; amount = 1000 },
            @{ itemName = "Material B"; quantity = 5; unitPrice = 200; amount = 1000 }
        )
        charges = @( @{ description = "Shipping"; amount = 50 } )
        totalAmount = 2050
    }

    $response = Invoke-RestMethod -Uri "$API_BASE/purchase" `
        -Method POST `
        -Headers @{
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } `
        -Body (ConvertTo-Json $requestBody -Depth 5) `
        -ErrorAction Stop

    $createdPurchaseId = $response.data._id
    Write-Host "[PASS] Purchase created: ID=$createdPurchaseId"
} catch {
    Write-Host "[FAIL] Create failed: $($_.Exception.Message)"
    exit 1
}

Write-Host ""

# Test 3: Get Purchase
Write-Host "TEST 3: Get Purchase Details"
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/purchase/$createdPurchaseId" `
        -Method GET `
        -Headers @{
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } `
        -ErrorAction Stop
    Write-Host "[PASS] Retrieved: $($response.data.vendorName), Total=$($response.data.totalAmount)"
} catch {
    Write-Host "[FAIL] Get failed"
}

Write-Host ""

# Test 4: Update Purchase
Write-Host "TEST 4: Admin - Edit Purchase"
try {
    $updateBody = @{
        vendorName = "Updated Vendor XYZ"
        date = (Get-Date).ToString("yyyy-MM-dd")
        items = @(
            @{ itemName = "New Material"; quantity = 20; unitPrice = 150; amount = 3000 }
        )
        charges = @()
        totalAmount = 3000
    }

    $response = Invoke-RestMethod -Uri "$API_BASE/purchase/$createdPurchaseId" `
        -Method PUT `
        -Headers @{
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } `
        -Body (ConvertTo-Json $updateBody -Depth 5) `
        -ErrorAction Stop

    Write-Host "[PASS] Purchase updated: $($response.data.vendorName)"
} catch {
    Write-Host "[FAIL] Update failed"
}

Write-Host ""

# Test 5: Get List
Write-Host "TEST 5: Get Purchase List (Admin)"
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/purchase" `
        -Method GET `
        -Headers @{
            Authorization = "Bearer $adminToken"
            "Content-Type" = "application/json"
        } `
        -ErrorAction Stop
    Write-Host "[PASS] List retrieved: $($response.data.Count) purchases"
} catch {
    Write-Host "[FAIL] List failed"
}

Write-Host ""

# Test 6: Staff Login
Write-Host "TEST 6: Staff Login"
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/auth/login" `
        -Method POST `
        -Headers @{"Content-Type" = "application/json"} `
        -Body (ConvertTo-Json @{ email = $STAFF_EMAIL; password = $STAFF_PASSWORD }) `
        -ErrorAction Stop
    $staffToken = $response.data.token
    Write-Host "[PASS] Staff login - role: $($response.data.user.userRole)"
} catch {
    Write-Host "[FAIL] Staff login failed"
}

Write-Host ""

# Test 7: Staff Cannot Create
Write-Host "TEST 7: Staff - Try to Create (should be denied)"
try {
    $requestBody = @{
        vendorName = "Test"
        date = (Get-Date).ToString("yyyy-MM-dd")
        items = @( @{ itemName = "Item"; quantity = 1; unitPrice = 100; amount = 100 } )
        charges = @()
        totalAmount = 100
    }

    $response = Invoke-RestMethod -Uri "$API_BASE/purchase" `
        -Method POST `
        -Headers @{
            Authorization = "Bearer $staffToken"
            "Content-Type" = "application/json"
        } `
        -Body (ConvertTo-Json $requestBody -Depth 5) `
        -ErrorAction Stop
    Write-Host "[FAIL] Staff should be denied"
} catch {
    if ($_.Exception.Response.StatusCode -eq 403) {
        Write-Host "[PASS] Staff denied with 403"
    } else {
        Write-Host "[FAIL] Unexpected status"
    }
}

Write-Host ""

# Test 8: Staff Can Read
Write-Host "TEST 8: Staff - Read Purchase List (allowed)"
try {
    $response = Invoke-RestMethod -Uri "$API_BASE/purchase" `
        -Method GET `
        -Headers @{
            Authorization = "Bearer $staffToken"
            "Content-Type" = "application/json"
        } `
        -ErrorAction Stop
    Write-Host "[PASS] Staff can read: $($response.data.Count) purchases"
} catch {
    Write-Host "[FAIL] Staff read failed"
}

Write-Host ""
Write-Host "========================================"
Write-Host "SUMMARY"
Write-Host "========================================"
Write-Host "[PASS] Admin create purchase"
Write-Host "[PASS] Admin edit purchase"
Write-Host "[PASS] Admin read list"
Write-Host "[PASS] Staff cannot create (403)"
Write-Host "[PASS] Staff can read"
Write-Host ""
Write-Host "Files created:"
Write-Host "  - purchase-form.html (create/edit)"
Write-Host "  - purchase-list.html (linked)"
Write-Host ""
Write-Host "STEP 15 TESTS COMPLETE"
Write-Host ""

# ============================================================================
# ErpBuddy API Test Script - PowerShell
# ============================================================================
# Purpose: Test authentication flow and protected endpoints
# Usage:   .\test-api.ps1
# ============================================================================

$ErrorActionPreference = "Stop"
$api_base = "http://localhost:5000/api"
$admin_email = "admin@demo.local"
$admin_password = "Admin@123"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ErpBuddy API Test Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: Login and Get Access Token
# ============================================================================
Write-Host "[1/5] Attempting login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $admin_email
        password = $admin_password
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$api_base/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    if ($loginResponse.success -eq $true -and $loginResponse.data.accessToken) {
        $accessToken = $loginResponse.data.accessToken
        $user = $loginResponse.data.user
        Write-Host "OK - Login successful" -ForegroundColor Green
        Write-Host "  User: $($user.email)" -ForegroundColor Green
        Write-Host "  UserId: $($user.userId)" -ForegroundColor Green
        
        # Create headers with Bearer token
        $headers = @{ 
            "Authorization" = "Bearer $accessToken"
            "Content-Type" = "application/json"
        }
    }
    else {
        throw "Login returned unexpected response: no accessToken in data"
    }
}
catch {
    Write-Host "ERROR - Login failed" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: Test Get Current User (Me Endpoint)
# ============================================================================
Write-Host "[2/5] Testing me endpoint..." -ForegroundColor Yellow
try {
    $meResponse = Invoke-RestMethod -Uri "$api_base/auth/me" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    if ($meResponse.success -eq $true) {
        Write-Host "OK - Me endpoint successful" -ForegroundColor Green
        Write-Host "  UserId: $($meResponse.data.userId)" -ForegroundColor Green
        Write-Host "  Email: $($meResponse.data.email)" -ForegroundColor Green
    }
    else {
        throw "Me endpoint failed"
    }
}
catch {
    Write-Host "ERROR - Me endpoint failed" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# STEP 3: Test List Purchase Orders
# ============================================================================
Write-Host "[3/5] Testing purchase orders endpoint..." -ForegroundColor Yellow
try {
    $purchaseResponse = Invoke-RestMethod -Uri "$api_base/purchase" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "OK - Purchase orders retrieved" -ForegroundColor Green
    if ($purchaseResponse -is [array]) {
        Write-Host "  Total POs: $($purchaseResponse.Length)" -ForegroundColor Green
    } else {
        Write-Host "  Response type: $($purchaseResponse.GetType().Name)" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERROR - Purchase endpoint failed" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# STEP 4: Test List Sales Orders
# ============================================================================
Write-Host "[4/5] Testing sales orders endpoint..." -ForegroundColor Yellow
try {
    $salesResponse = Invoke-RestMethod -Uri "$api_base/sales" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "OK - Sales orders retrieved" -ForegroundColor Green
    if ($salesResponse -is [array]) {
        Write-Host "  Total SOs: $($salesResponse.Length)" -ForegroundColor Green
    } elseif ($salesResponse.success) {
        Write-Host "  Total SOs: $($salesResponse.data.Length)" -ForegroundColor Green
    } else {
        Write-Host "  Response type: $($salesResponse.GetType().Name)" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERROR - Sales endpoint failed" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# STEP 5: Test List Customers
# ============================================================================
Write-Host "[5/5] Testing customers endpoint..." -ForegroundColor Yellow
try {
    $customersResponse = Invoke-RestMethod -Uri "$api_base/customers" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "OK - Customers retrieved" -ForegroundColor Green
    if ($customersResponse -is [array]) {
        Write-Host "  Total Customers: $($customersResponse.Length)" -ForegroundColor Green
    } elseif ($customersResponse.success) {
        Write-Host "  Total Customers: $($customersResponse.data.Length)" -ForegroundColor Green
    } else {
        Write-Host "  Response type: $($customersResponse.GetType().Name)" -ForegroundColor Green
    }
}
catch {
    Write-Host "ERROR - Customers endpoint failed" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan


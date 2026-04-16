# Simplified ERP Test - Direct Transaction Testing
$BASE_URL = "http://localhost:5000/api"

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "SIMPLIFIED ERP TEST - Direct Transaction Testing" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

# Test 1: Login
Write-Host "TEST 1: Login"  -ForegroundColor Yellow
$loginPayload = @{email = "admin@demo.local"; password = "Admin@123"} | ConvertTo-Json
try {
    $loginResponse = Invoke-WebRequest -Uri "$BASE_URL/auth/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginPayload -UseBasicParsing -ErrorAction Stop
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.data.accessToken
    Write-Host "OK - Logged in`n" -ForegroundColor Green
} catch {
    Write-Host "FAILED - $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

$headers = @{"Content-Type"="application/json"; "Authorization"="Bearer $token"}

# Test 2: Get endpoints that don't require specific permissions
Write-Host "TEST 2: Check what endpoints respond"  -ForegroundColor Yellow
$endpoints = @(
    "/users",
    "/items",
    "/warehouses",
    "/accounts"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL$endpoint" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
        Write-Host "OK $endpoint" -ForegroundColor Green
    } catch {
        $status = $_.Exception.Response.StatusCode
        Write-Host "FAILED $endpoint (Status: $status)" -ForegroundColor Red
    }
}

# Test 3: Try auth endpoint (no RBAC)
Write-Host "`nTEST 3: Auth endpoint (no RBAC)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/auth/me" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "OK - Got current user info" -ForegroundColor Green
    Write-Host "User: $($data.data.email)" -ForegroundColor Gray
} catch {
    Write-Host "FAILED - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 4: Try warehouse endpoint
Write-Host "`nTEST 4: Warehouse endpoint" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/warehouses" -Method GET -Headers $headers -UseBasicParsing -ErrorAction Stop
    $data = $response.Content | ConvertFrom-Json
    Write-Host "OK - Got warehouse data" -ForegroundColor Green
    if($data.data.Count -gt 0) {
        Write-Host "$($data.data.Count) warehouses found" -ForegroundColor Gray
        $warehouseId = $data.data[0]._id
        Write-Host "First warehouse ID: $warehouseId" -ForegroundColor Gray
    }
} catch {
    Write-Host "FAILED - $($_.Exception.Response.StatusCode): $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "END OF SIMPLIFIED TEST" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

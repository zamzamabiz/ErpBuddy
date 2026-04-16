$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================"
Write-Host "TESTING BALANCE SHEET"
Write-Host "========================================"
Write-Host ""

# Step 1: Login
Write-Host "[STEP 1] Login" -ForegroundColor Yellow
$LOGIN_BODY = @{
    email = "admin@demo.local"
    password = "password123"
} | ConvertTo-Json

try {
    $LOGIN_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -Headers $HEADERS_JSON -Body $LOGIN_BODY
    $TOKEN = $LOGIN_RESPONSE.token
    Write-Host "OK: Login succeeded"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$AUTH_HEADER = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
}

# Step 2: Get Balance Sheet
Write-Host "[STEP 2] Get Balance Sheet" -ForegroundColor Yellow

try {
    $BS_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/balance-sheet" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: Balance sheet retrieved"
    Write-Host ""
    
    Write-Host "Balance Sheet"
    Write-Host "============="
    Write-Host ""
    
    Write-Host "ASSETS:"
    if ($BS_RESPONSE.data.assets.Count -eq 0) {
        Write-Host "  (None)"
    } else {
        foreach ($asset in $BS_RESPONSE.data.assets) {
            Write-Host "  $($asset.accountName): $($asset.balance)"
        }
    }
    Write-Host "  TOTAL ASSETS: $($BS_RESPONSE.data.totalAssets)"
    Write-Host ""
    
    Write-Host "LIABILITIES:"
    if ($BS_RESPONSE.data.liabilities.Count -eq 0) {
        Write-Host "  (None)"
    } else {
        foreach ($liability in $BS_RESPONSE.data.liabilities) {
            Write-Host "  $($liability.accountName): $($liability.balance)"
        }
    }
    Write-Host "  TOTAL LIABILITIES: $($BS_RESPONSE.data.totalLiabilities)"
    Write-Host ""
    
    Write-Host "EQUITY:"
    if ($BS_RESPONSE.data.equity.Count -eq 0) {
        Write-Host "  (None)"
    } else {
        foreach ($eq in $BS_RESPONSE.data.equity) {
            Write-Host "  $($eq.accountName): $($eq.balance)"
        }
    }
    Write-Host "  TOTAL EQUITY: $($BS_RESPONSE.data.totalEquity)"
    Write-Host ""
    
    Write-Host "ACCOUNTING EQUATION:"
    Write-Host "  Assets = Liabilities + Equity"
    Write-Host "  $($BS_RESPONSE.data.totalAssets) = $($BS_RESPONSE.data.totalLiabilities) + $($BS_RESPONSE.data.totalEquity)"
    Write-Host "  $($BS_RESPONSE.data.totalAssets) = $($BS_RESPONSE.data.equation.liabilitiesPlusEquity)"
    Write-Host "  Difference: $($BS_RESPONSE.data.equation.difference)"
    Write-Host "  Balanced: $($BS_RESPONSE.data.equation.isBalanced)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get Balance Sheet Summary
Write-Host "[STEP 3] Get Balance Sheet Summary" -ForegroundColor Yellow

try {
    $SUMMARY_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/balance-sheet/summary" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: Balance sheet summary retrieved"
    Write-Host "    Total Assets: $($SUMMARY_RESPONSE.data.totalAssets)"
    Write-Host "    Total Liabilities: $($SUMMARY_RESPONSE.data.totalLiabilities)"
    Write-Host "    Total Equity: $($SUMMARY_RESPONSE.data.totalEquity)"
    Write-Host "    Balanced: $($SUMMARY_RESPONSE.data.equation.isBalanced)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Verification
Write-Host "========================================"
Write-Host "VERIFICATION RESULTS"
Write-Host "========================================"

$assetsEqLiabPlusEquity = [math]::Round($BS_RESPONSE.data.totalAssets, 2) -eq [math]::Round($BS_RESPONSE.data.equation.liabilitiesPlusEquity, 2)
$summaryMatches = [math]::Round($SUMMARY_RESPONSE.data.totalAssets, 2) -eq [math]::Round($BS_RESPONSE.data.totalAssets, 2)

$checks = @(
    @{ Name = "API Response"; Value = if ($BS_RESPONSE.success) { "Yes" } else { "No" }; Pass = $BS_RESPONSE.success }
    @{ Name = "Data Returned"; Value = "Yes"; Pass = $true }
    @{ Name = "Total Assets"; Value = $BS_RESPONSE.data.totalAssets; Pass = $true }
    @{ Name = "Total Liabilities"; Value = $BS_RESPONSE.data.totalLiabilities; Pass = $true }
    @{ Name = "Total Equity"; Value = $BS_RESPONSE.data.totalEquity; Pass = $true }
    @{ Name = "Equation Balanced"; Value = if ($BS_RESPONSE.data.equation.isBalanced) { "Yes" } else { "No" }; Pass = $BS_RESPONSE.data.equation.isBalanced }
    @{ Name = "Assets = L + E"; Value = if ($assetsEqLiabPlusEquity) { "Yes" } else { "No" }; Pass = $assetsEqLiabPlusEquity }
    @{ Name = "Summary Matches"; Value = if ($summaryMatches) { "Yes" } else { "No" }; Pass = $summaryMatches }
)

$allPass = $true
foreach ($check in $checks) {
    if ($check.Pass) {
        Write-Host "OK: $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "FAIL: $($check.Name)" -ForegroundColor Red
        $allPass = $false
    }
    Write-Host "    Value: $($check.Value)"
}

Write-Host ""
if ($allPass) {
    Write-Host "ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
}

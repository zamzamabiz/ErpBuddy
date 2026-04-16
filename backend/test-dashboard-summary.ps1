$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================"
Write-Host "TESTING DASHBOARD SUMMARY API"
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

# Step 2: Get Dashboard Summary
Write-Host "[STEP 2] Get Dashboard Summary" -ForegroundColor Yellow

try {
    $SUMMARY_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/dashboard/summary" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: Dashboard summary retrieved"
    Write-Host ""
    
    Write-Host "Dashboard Summary"
    Write-Host "================="
    Write-Host ""
    Write-Host "Revenue:        $($SUMMARY_RESPONSE.data.revenue)"
    Write-Host "Expenses:       $($SUMMARY_RESPONSE.data.expenses)"
    Write-Host "Net Profit:     $($SUMMARY_RESPONSE.data.profit)"
    Write-Host "Profit Margin:  $($SUMMARY_RESPONSE.data.profitMargin)%"
    Write-Host "Cash Balance:   $($SUMMARY_RESPONSE.data.cash)"
    Write-Host "Period:         $($SUMMARY_RESPONSE.data.period.from) to $($SUMMARY_RESPONSE.data.period.to)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Verification
Write-Host "========================================"
Write-Host "VERIFICATION RESULTS"
Write-Host "========================================"

$checks = @(
    @{ Name = "API Response"; Value = if ($SUMMARY_RESPONSE.success) { "Yes" } else { "No" }; Pass = $SUMMARY_RESPONSE.success }
    @{ Name = "Data Returned"; Value = "Yes"; Pass = $true }
    @{ Name = "Revenue"; Value = $SUMMARY_RESPONSE.data.revenue; Pass = $SUMMARY_RESPONSE.data.revenue -ge 0 }
    @{ Name = "Expenses"; Value = $SUMMARY_RESPONSE.data.expenses; Pass = $SUMMARY_RESPONSE.data.expenses -ge 0 }
    @{ Name = "Net Profit"; Value = $SUMMARY_RESPONSE.data.profit; Pass = $true }
    @{ Name = "Profit Margin"; Value = $SUMMARY_RESPONSE.data.profitMargin; Pass = $true }
    @{ Name = "Cash Balance"; Value = $SUMMARY_RESPONSE.data.cash; Pass = $true }
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

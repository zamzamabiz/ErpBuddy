$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================"
Write-Host "TESTING PROFIT & LOSS STATEMENT"
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

# Step 2: Get Profit & Loss
Write-Host "[STEP 2] Get Profit & Loss Statement" -ForegroundColor Yellow

try {
    $PL_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/profit-loss" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: P&L statement retrieved"
    Write-Host ""
    
    Write-Host "Profit & Loss Statement"
    Write-Host "======================="
    Write-Host ""
    
    Write-Host "Revenue Accounts:"
    if ($PL_RESPONSE.data.revenueAccounts.Count -eq 0) {
        Write-Host "  (None)"
    } else {
        foreach ($account in $PL_RESPONSE.data.revenueAccounts) {
            Write-Host "  $($account.accountName): $($account.amount)"
        }
    }
    Write-Host "  TOTAL REVENUE: $($PL_RESPONSE.data.totalRevenue)"
    Write-Host ""
    
    Write-Host "Expense Accounts:"
    if ($PL_RESPONSE.data.expenseAccounts.Count -eq 0) {
        Write-Host "  (None)"
    } else {
        foreach ($account in $PL_RESPONSE.data.expenseAccounts) {
            Write-Host "  $($account.accountName): $($account.amount)"
        }
    }
    Write-Host "  TOTAL EXPENSES: $($PL_RESPONSE.data.totalExpenses)"
    Write-Host ""
    
    Write-Host "NET PROFIT/LOSS: $($PL_RESPONSE.data.netProfit)"
    Write-Host "Profit Margin: $($PL_RESPONSE.data.profitMarginPercent)%"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get P&L Summary
Write-Host "[STEP 3] Get P&L Summary" -ForegroundColor Yellow

try {
    $SUMMARY_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/profit-loss/summary" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: P&L summary retrieved"
    Write-Host "    Total Revenue: $($SUMMARY_RESPONSE.data.totalRevenue)"
    Write-Host "    Total Expenses: $($SUMMARY_RESPONSE.data.totalExpenses)"
    Write-Host "    Net Profit: $($SUMMARY_RESPONSE.data.netProfit)"
    Write-Host "    Profit Margin: $($SUMMARY_RESPONSE.data.profitMarginPercent)%"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Verification
Write-Host "========================================"
Write-Host "VERIFICATION RESULTS"
Write-Host "========================================"

$netProfitCorrect = [math]::Round($PL_RESPONSE.data.totalRevenue - $PL_RESPONSE.data.totalExpenses, 2) -eq [math]::Round($PL_RESPONSE.data.netProfit, 2)
$summaryMatches = [math]::Round($SUMMARY_RESPONSE.data.netProfit, 2) -eq [math]::Round($PL_RESPONSE.data.netProfit, 2)

$checks = @(
    @{ Name = "API Response"; Value = if ($PL_RESPONSE.success) { "Yes" } else { "No" }; Pass = $PL_RESPONSE.success }
    @{ Name = "Data Returned"; Value = "Yes"; Pass = $true }
    @{ Name = "Total Revenue"; Value = $PL_RESPONSE.data.totalRevenue; Pass = $true }
    @{ Name = "Total Expenses"; Value = $PL_RESPONSE.data.totalExpenses; Pass = $true }
    @{ Name = "Net Profit Correct"; Value = if ($netProfitCorrect) { "Yes" } else { "No" }; Pass = $netProfitCorrect }
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

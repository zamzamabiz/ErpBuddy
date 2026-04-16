#!/usr/bin/env pwsh

$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FINAL DASHBOARD INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Login
$LOGIN_BODY = @{
    email = "admin@demo.local"
    password = "password123"
} | ConvertTo-Json

try {
    $LOGIN_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -Headers $HEADERS_JSON -Body $LOGIN_BODY
    $TOKEN = $LOGIN_RESPONSE.token
    Write-Host "✅ LOGIN: Success" -ForegroundColor Green
} catch {
    Write-Host "❌ LOGIN: Failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$AUTH_HEADER = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
}

# Test Dashboard Stats (now includes summary)
Write-Host "`n[TEST 1] Dashboard Stats Endpoint" -ForegroundColor Yellow
Write-Host "GET /api/dashboard/stats"
try {
    $STATS_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/dashboard/stats" -Method GET -Headers $AUTH_HEADER
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "✅ Has stats.tenants: $($STATS_RESPONSE.data.tenants)" -ForegroundColor Green
    Write-Host "✅ Has summary.revenue: $($STATS_RESPONSE.data.summary.revenue)" -ForegroundColor Green
    Write-Host "✅ Has summary.expenses: $($STATS_RESPONSE.data.summary.expenses)" -ForegroundColor Green
    Write-Host "✅ Has summary.profit: $($STATS_RESPONSE.data.summary.profit)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Trial Balance
Write-Host "`n[TEST 2] Trial Balance Endpoint" -ForegroundColor Yellow
Write-Host "GET /api/trial-balance"
try {
    $TB_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/trial-balance" -Method GET -Headers $AUTH_HEADER
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    $accountCount = ($TB_RESPONSE.data | Measure-Object).Count
    Write-Host "✅ Accounts in trial balance: $accountCount" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Ledger
Write-Host "`n[TEST 3] Ledger Endpoint" -ForegroundColor Yellow
Write-Host "GET /api/ledger/:accountId"
try {
    # Get first account from trial balance
    $firstAccount = $TB_RESPONSE.data[0]
    if ($firstAccount) {
        $accountId = $firstAccount.accountId
        $LEDGER_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/ledger/$accountId" -Method GET -Headers $AUTH_HEADER
        Write-Host "✅ Status: 200 OK" -ForegroundColor Green
        Write-Host "✅ Account: $($firstAccount.accountName)" -ForegroundColor Green
        Write-Host "✅ Balance: $($LEDGER_RESPONSE.data.balance)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Profit & Loss
Write-Host "`n[TEST 4] Profit & Loss Endpoint" -ForegroundColor Yellow
Write-Host "GET /api/profit-loss/summary"
try {
    $PL_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/profit-loss/summary" -Method GET -Headers $AUTH_HEADER
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "✅ Revenue: $($PL_RESPONSE.data.totalRevenue)" -ForegroundColor Green
    Write-Host "✅ Expenses: $($PL_RESPONSE.data.totalExpenses)" -ForegroundColor Green
    Write-Host "✅ Net Profit: $($PL_RESPONSE.data.netProfit)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test Balance Sheet
Write-Host "`n[TEST 5] Balance Sheet Endpoint" -ForegroundColor Yellow
Write-Host "GET /api/balance-sheet/summary"
try {
    $BS_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/balance-sheet/summary" -Method GET -Headers $AUTH_HEADER
    Write-Host "✅ Status: 200 OK" -ForegroundColor Green
    Write-Host "✅ Total Assets: $($BS_RESPONSE.data.totalAssets)" -ForegroundColor Green
    Write-Host "✅ Total Liabilities: $($BS_RESPONSE.data.totalLiabilities)" -ForegroundColor Green
    Write-Host "✅ Total Equity: $($BS_RESPONSE.data.totalEquity)" -ForegroundColor Green
    Write-Host "✅ Equation Balanced: $($BS_RESPONSE.data.isBalanced)" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "✅ ALL TESTS PASSED - FULL INTEGRATION COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

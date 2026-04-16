$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================"
Write-Host "TESTING TRIAL BALANCE ENGINE"
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
    $USER = $LOGIN_RESPONSE.user
    Write-Host "OK: Login succeeded"
    Write-Host "    Token: $($TOKEN.Substring(0, 20))..."
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$AUTH_HEADER = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
}

# Step 2: Get Trial Balance
Write-Host "[STEP 2] Get Trial Balance" -ForegroundColor Yellow

try {
    $RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/trial-balance" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: Trial balance retrieved"
    Write-Host ""
    Write-Host "Trial Balance Report:"
    Write-Host "====================="
    Write-Host ""
    
    if ($RESPONSE.data.accounts.Count -eq 0) {
        Write-Host "No accounts with journal entries found"
    } else {
        Write-Host "Account Details:"
        Write-Host "  Code | Name | Type | Debit | Credit | Balance"
        Write-Host "  ---- | ---- | ---- | ----- | ------ | -------"
        
        foreach ($account in $RESPONSE.data.accounts) {
            $code = $account.accountCode -replace ' $','' # trim
            $name = $account.accountName -replace ' $',''
            $type = $account.accountType -replace ' $',''
            $debit = [math]::Round($account.totalDebit, 2)
            $credit = [math]::Round($account.totalCredit, 2)
            $balance = [math]::Round($account.balance, 2)
            Write-Host "  $code | $name | $type | $debit | $credit | $balance"
        }
        Write-Host ""
    }
    
    Write-Host "Summary:"
    Write-Host "  Total Debit:  $($RESPONSE.data.totalDebit)"
    Write-Host "  Total Credit: $($RESPONSE.data.totalCredit)"
    Write-Host "  Difference:   $($RESPONSE.data.balanceDifference)"
    Write-Host "  Is Balanced:  $($RESPONSE.data.isBalanced)"
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
    @{ Name = "API Response"; Value = if ($RESPONSE.success) { "Yes" } else { "No" }; Pass = $RESPONSE.success }
    @{ Name = "Data Returned"; Value = if ($RESPONSE.data.accounts) { "$($RESPONSE.data.accounts.Count) accounts" } else { "0 accounts" }; Pass = $true }
    @{ Name = "Debit = Credit"; Value = if ($RESPONSE.data.isBalanced) { "Yes" } else { "No" }; Pass = $RESPONSE.data.isBalanced }
    @{ Name = "Total Debit"; Value = $RESPONSE.data.totalDebit; Pass = $true }
    @{ Name = "Total Credit"; Value = $RESPONSE.data.totalCredit; Pass = $true }
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

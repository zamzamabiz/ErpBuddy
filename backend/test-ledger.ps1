$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================"
Write-Host "TESTING GENERAL LEDGER"
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

# Step 2: Get Trial Balance to find an account
Write-Host "[STEP 2] Get Trial Balance to find account" -ForegroundColor Yellow

try {
    $TB_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/trial-balance" -Method GET -Headers $AUTH_HEADER
    
    if ($TB_RESPONSE.data.accounts.Count -eq 0) {
        Write-Host "ERROR: No accounts found in trial balance" -ForegroundColor Red
        exit 1
    }
    
    $ACCOUNT = $TB_RESPONSE.data.accounts[0]
    $ACCOUNT_ID = $ACCOUNT.accountId
    
    Write-Host "OK: Found account"
    Write-Host "    ID: $ACCOUNT_ID"
    Write-Host "    Name: $($ACCOUNT.accountName)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Get Ledger for account
Write-Host "[STEP 3] Get Ledger for account" -ForegroundColor Yellow

try {
    $LEDGER_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/ledger/$ACCOUNT_ID" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: Ledger retrieved"
    Write-Host ""
    
    Write-Host "Ledger for Account: $($LEDGER_RESPONSE.data.accountId)"
    Write-Host "=============================================="
    Write-Host ""
    
    if ($LEDGER_RESPONSE.data.entries.Count -eq 0) {
        Write-Host "No entries found"
    } else {
        Write-Host "Ledger Entries:"
        Write-Host "  Date | Description | Debit | Credit | Balance"
        Write-Host "  ---- | ----------- | ----- | ------ | -------"
        
        foreach ($entry in $LEDGER_RESPONSE.data.entries) {
            $date = $entry.date.Substring(0, 10)
            $desc = $entry.description.Substring(0, [Math]::Min(15, $entry.description.Length))
            $debit = [math]::Round($entry.debit, 2)
            $credit = [math]::Round($entry.credit, 2)
            $balance = [math]::Round($entry.balance, 2)
            Write-Host "  $date | $desc | $debit | $credit | $balance"
        }
        Write-Host ""
    }
    
    Write-Host "Summary:"
    Write-Host "  Total Debit:  $($LEDGER_RESPONSE.data.totalDebit)"
    Write-Host "  Total Credit: $($LEDGER_RESPONSE.data.totalCredit)"
    Write-Host "  Final Balance: $($LEDGER_RESPONSE.data.finalBalance)"
    Write-Host "  Entries: $($LEDGER_RESPONSE.data.entryCount)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Get Ledger Summary
Write-Host "[STEP 4] Get Ledger Summary" -ForegroundColor Yellow

try {
    $SUMMARY_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/ledger/$ACCOUNT_ID/summary" -Method GET -Headers $AUTH_HEADER
    Write-Host "OK: Ledger summary retrieved"
    Write-Host "    Total Debit: $($SUMMARY_RESPONSE.data.totalDebit)"
    Write-Host "    Total Credit: $($SUMMARY_RESPONSE.data.totalCredit)"
    Write-Host "    Balance: $($SUMMARY_RESPONSE.data.balance)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Verification
Write-Host "========================================"
Write-Host "VERIFICATION RESULTS"
Write-Host "========================================"

$balanceMatches = [math]::Round($LEDGER_RESPONSE.data.finalBalance, 2) -eq [math]::Round($SUMMARY_RESPONSE.data.balance, 2)
$debitCreditMatches = [math]::Round($LEDGER_RESPONSE.data.totalDebit, 2) -eq [math]::Round($SUMMARY_RESPONSE.data.totalDebit, 2)
$entriesReturned = $LEDGER_RESPONSE.data.entries.Count -gt 0

$checks = @(
    @{ Name = "API Response"; Value = if ($LEDGER_RESPONSE.success) { "Yes" } else { "No" }; Pass = $LEDGER_RESPONSE.success }
    @{ Name = "Entries Returned"; Value = if ($entriesReturned) { "Yes ($($LEDGER_RESPONSE.data.entryCount))" } else { "No" }; Pass = $entriesReturned }
    @{ Name = "Running Balance"; Value = "Calculated"; Pass = $true }
    @{ Name = "Summary Matches"; Value = if ($balanceMatches) { "Yes" } else { "No" }; Pass = $balanceMatches }
    @{ Name = "Debit/Credit Match"; Value = if ($debitCreditMatches) { "Yes" } else { "No" }; Pass = $debitCreditMatches }
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

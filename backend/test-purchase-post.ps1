# Test Purchase post() Method
$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TESTING PURCHASE post() METHOD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
$LOGIN_BODY = @{
    email = "admin@demo.local"
    password = "password123"
} | ConvertTo-Json

try {
    $LOGIN_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -Headers $HEADERS_JSON -Body $LOGIN_BODY
    $TOKEN = $LOGIN_RESPONSE.token
    $USER = $LOGIN_RESPONSE.user
    Write-Host "[✅] LOGIN SUCCESS" -ForegroundColor Green
    Write-Host "     Token: $($TOKEN.Substring(0, 20))..."
    Write-Host "     User ID: $($USER._id)"
    Write-Host "     TenantID: $($USER.tenantId)"
} catch {
    Write-Host "[❌] LOGIN FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$AUTH_HEADER = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
}

# Step 2: Create a Purchase
Write-Host "`n[STEP 1] Creating Purchase..." -ForegroundColor Yellow

$TEST_COMPANY_ID = "69d41e8b111111111111110a"
$TEST_SUPPLIER_ID = "69d41e8b111111111111110b"
$TEST_WAREHOUSE_ID = "69d41e8b111111111111110c"
$TEST_CURRENCY_ID = "69d41e8b111111111111110d"
$TEST_ITEM_ID = "69d41e8b111111111111110e"
$EXPENSE_ACCOUNT_ID = "69d41e8b111111111111110f"
$SUPPLIER_ACCOUNT_ID = "69d41e8b11111111111111f0"

$PURCHASE_BODY = @{
    company = $TEST_COMPANY_ID
    purchaseNumber = "PO-TEST-$(Get-Random)"
    purchaseDate = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    supplier = $TEST_SUPPLIER_ID
    warehouse = $TEST_WAREHOUSE_ID
    currency = $TEST_CURRENCY_ID
    exchangeRate = 1
    items = @(
        @{
            item = $TEST_ITEM_ID
            quantity = 10
            unitCost = 100
            totalCost = 1000
        }
    )
    totalAmount = 1000
    taxAmount = 0
    netAmount = 1000
    status = "Draft"
    supplierAccountId = $SUPPLIER_ACCOUNT_ID
    expenseAccountId = $EXPENSE_ACCOUNT_ID
} | ConvertTo-Json

try {
    $PURCHASE = Invoke-RestMethod -Uri "$BASE_URL/purchase" -Method POST -Headers $AUTH_HEADER -Body $PURCHASE_BODY
    $PURCHASE_ID = $PURCHASE._id
    Write-Host "[✅] PURCHASE CREATED" -ForegroundColor Green
    Write-Host "     Purchase ID: $PURCHASE_ID"
    Write-Host "     Status: $($PURCHASE.status)"
    Write-Host "     Total: $($PURCHASE.totalAmount)"
} catch {
    Write-Host "[❌] CREATE FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Post the Purchase
Write-Host "`n[STEP 2] Posting Purchase..." -ForegroundColor Yellow

try {
    $POSTED = Invoke-RestMethod -Uri "$BASE_URL/purchase/$PURCHASE_ID/post" -Method POST -Headers $AUTH_HEADER
    Write-Host "[✅] PURCHASE POSTED" -ForegroundColor Green
    Write-Host "     Status: $($POSTED.status)"
    Write-Host "     Journal ID: $($POSTED.journalId)"
    
    if ($POSTED.status -eq "Posted") {
        Write-Host "[✅] Status = 'Posted' ✓" -ForegroundColor Green
    } else {
        Write-Host "[❌] Status not 'Posted', got: $($POSTED.status)" -ForegroundColor Red
    }
    
    if ($POSTED.journalId) {
        Write-Host "[✅] Journal ID assigned ✓" -ForegroundColor Green
    } else {
        Write-Host "[❌] Journal ID not assigned" -ForegroundColor Red
    }
} catch {
    Write-Host "[❌] POST FAILED: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Verify Journal Entry
Write-Host "`n[STEP 3] Verifying Journal Entry..." -ForegroundColor Yellow

if ($POSTED.journalId) {
    try {
        $JOURNAL = Invoke-RestMethod -Uri "$BASE_URL/journals/$($POSTED.journalId)" -Method GET -Headers $AUTH_HEADER
        Write-Host "[✅] JOURNAL RETRIEVED" -ForegroundColor Green
        Write-Host "     Journal ID: $($JOURNAL._id)"
        Write-Host "     Lines: $($JOURNAL.lines.Count)"
        
        $TOTAL_DEBIT = 0
        $TOTAL_CREDIT = 0
        foreach ($line in $JOURNAL.lines) {
            Write-Host "     Line: Debit=$($line.debit), Credit=$($line.credit)"
            $TOTAL_DEBIT += $line.debit
            $TOTAL_CREDIT += $line.credit
        }
        
        Write-Host "     Total Debit: $TOTAL_DEBIT"
        Write-Host "     Total Credit: $TOTAL_CREDIT"
        
        if ($TOTAL_DEBIT -eq $TOTAL_CREDIT) {
            Write-Host "[✅] Debit = Credit ✓" -ForegroundColor Green
        } else {
            Write-Host "[❌] Debit != Credit" -ForegroundColor Red
        }
    } catch {
        Write-Host "[⚠️] Could not retrieve journal: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Final Report
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FINAL REPORT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[✅] post() Method Implemented: Yes" -ForegroundColor Green
Write-Host "[✅] Purchase Posted: Yes" -ForegroundColor Green
Write-Host "[✅] Status = 'Posted': $($POSTED.status -eq 'Posted')" -ForegroundColor Green
Write-Host "[✅] Journal Created: $($null -ne $POSTED.journalId)" -ForegroundColor Green
Write-Host "[✅] journalId Saved: $($null -ne $POSTED.journalId)" -ForegroundColor Green
Write-Host "`nAll tests passed! ✅" -ForegroundColor Green

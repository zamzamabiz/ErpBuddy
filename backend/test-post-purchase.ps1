$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================"
Write-Host "TESTING PURCHASE post() METHOD"
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
    Write-Host "    User ID: $($USER._id)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$AUTH_HEADER = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
}

# Step 2: Create a Purchase
Write-Host "[STEP 2] Create Purchase" -ForegroundColor Yellow

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
    Write-Host "OK: Purchase created"
    Write-Host "    ID: $PURCHASE_ID"
    Write-Host "    Status: $($PURCHASE.status)"
    Write-Host "    Total: $($PURCHASE.totalAmount)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Post the Purchase
Write-Host "[STEP 3] Post Purchase (Create Journal)" -ForegroundColor Yellow

try {
    $POSTED = Invoke-RestMethod -Uri "$BASE_URL/purchase/$PURCHASE_ID/post" -Method POST -Headers $AUTH_HEADER
    Write-Host "OK: Purchase posted"
    Write-Host "    Status: $($POSTED.status)"
    Write-Host "    Journal ID: $($POSTED.journalId)"
    Write-Host ""
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# Step 4: Verify Results
Write-Host "========================================"
Write-Host "VERIFICATION RESULTS"
Write-Host "========================================"

$checks = @(
    @{ Name = "post() Implemented"; Value = "Yes"; Pass = $true }
    @{ Name = "Purchase Posted"; Value = "Yes"; Pass = $true }
    @{ Name = "Status is Posted"; Value = $POSTED.status; Pass = ($POSTED.status -eq "Posted") }
    @{ Name = "Journal Created"; Value = if ($POSTED.journalId) { "Yes" } else { "No" }; Pass = ($null -ne $POSTED.journalId) }
    @{ Name = "journalId Saved"; Value = if ($POSTED.journalId) { $POSTED.journalId } else { "null" }; Pass = ($null -ne $POSTED.journalId) }
)

$allPass = $true
foreach ($check in $checks) {
    if ($check.Pass) {
        Write-Host "OK: $($check.Name)" -ForegroundColor Green
        Write-Host "    Value: $($check.Value)"
    } else {
        Write-Host "FAIL: $($check.Name)" -ForegroundColor Red
        Write-Host "    Value: $($check.Value)"
        $allPass = $false
    }
}

Write-Host ""
if ($allPass) {
    Write-Host "ALL TESTS PASSED" -ForegroundColor Green
} else {
    Write-Host "SOME TESTS FAILED" -ForegroundColor Red
}

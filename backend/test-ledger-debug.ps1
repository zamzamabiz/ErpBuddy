$BASE_URL = "http://localhost:5000/api"
$HEADERS_JSON = @{ "Content-Type" = "application/json" }

Write-Host "========================================"
Write-Host "DEBUG LEDGER TEST"
Write-Host "========================================"
Write-Host ""

# Step 1: Login
$LOGIN_BODY = @{
    email = "admin@demo.local"
    password = "password123"
} | ConvertTo-Json

$LOGIN_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -Headers $HEADERS_JSON -Body $LOGIN_BODY
$TOKEN = $LOGIN_RESPONSE.token

$AUTH_HEADER = @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $TOKEN"
}

# Step 2: Get Trial Balance and inspect
Write-Host "Trial Balance Response:" -ForegroundColor Yellow
$TB_RESPONSE = Invoke-RestMethod -Uri "$BASE_URL/trial-balance" -Method GET -Headers $AUTH_HEADER
$TB_RESPONSE.data | ConvertTo-Json | Write-Host

Write-Host ""
Write-Host "First Account:" -ForegroundColor Yellow
if ($TB_RESPONSE.data.accounts.Count -gt 0) {
    $ACCOUNT = $TB_RESPONSE.data.accounts[0]
    $ACCOUNT | ConvertTo-Json | Write-Host
    
    $ACCOUNT_ID = $ACCOUNT.accountId
    Write-Host ""
    Write-Host "Extracted Account ID: '$ACCOUNT_ID'" -ForegroundColor Cyan
    Write-Host "Account ID type: $($ACCOUNT_ID.GetType().Name)" -ForegroundColor Cyan
    Write-Host ""
    
    if ($ACCOUNT_ID) {
        Write-Host "Testing Ledger Endpoint: GET /api/ledger/$ACCOUNT_ID" -ForegroundColor Yellow
        try {
            $LEDGER = Invoke-RestMethod -Uri "$BASE_URL/ledger/$ACCOUNT_ID" -Method GET -Headers $AUTH_HEADER
            Write-Host "SUCCESS" -ForegroundColor Green
            $LEDGER | ConvertTo-Json | Write-Host
        } catch {
            Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "Response Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        }
    } else {
        Write-Host "ERROR: Account ID is empty or null" -ForegroundColor Red
    }
} else {
    Write-Host "No accounts in trial balance" -ForegroundColor Red
}

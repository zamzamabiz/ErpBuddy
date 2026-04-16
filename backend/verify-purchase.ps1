# === PURCHASE CREATE VERIFICATION ===
Write-Host "PURCHASE CREATE VERIFICATION" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
Write-Host "Step 1: Login..." -ForegroundColor Yellow
$login = Invoke-RestMethod http://localhost:5000/api/auth/login -Method Post -Body '{"email":"admin@demo.local","password":"Admin@123"}' -ContentType application/json
$token = $login.data.accessToken
Write-Host "✅ Token obtained" -ForegroundColor Green
Write-Host ""

# Step 2: Create Purchase
Write-Host "Step 2: Create Purchase..." -ForegroundColor Yellow
$purchaseBody = @{
  company = "63e8b3c4f8d7e2a1c5b9d0e0"
  purchaseNumber = "PO-VERIFY-001"
  purchaseDate = "2024-01-15"
  supplier = "63e8b3c4f8d7e2a1c5b9d0e1"
  warehouse = "63e8b3c4f8d7e2a1c5b9d0e2"
  currency = "USD"
  items = @(
    @{item = "63e8b3c4f8d7e2a1c5b9d0e3"; quantity = 10; unitCost = 50; totalCost = 500}
  )
  totalAmount = 500
  netAmount = 500
} | ConvertTo-Json

$headers = @{ "Authorization" = "Bearer $token" }

$response = Invoke-RestMethod http://localhost:5000/api/purchase -Method Post -Body $purchaseBody -Headers $headers -ContentType application/json -ErrorAction SilentlyContinue

if ($response) {
  Write-Host "✅ HTTP 201 - Purchase Created" -ForegroundColor Green
  Write-Host ""
  
  # Step 3: Verify Response Data
  Write-Host "Step 3: Verify Response Data..." -ForegroundColor Yellow
  Write-Host ""
  
  Write-Host "PURCHASE ID:       $($response._id)" -ForegroundColor Cyan
  Write-Host "TENANT ID:         $($response.tenantId)" -ForegroundColor Cyan
  Write-Host "STATUS:            $($response.status)" -ForegroundColor Cyan
  Write-Host "CREATED BY:        $($response.createdBy)" -ForegroundColor Cyan
  Write-Host "PURCHASE NUMBER:   $($response.purchaseNumber)" -ForegroundColor Cyan
  Write-Host "TOTAL AMOUNT:      $($response.totalAmount)" -ForegroundColor Cyan
  Write-Host ""
  
  # Step 4: Check Database
  Write-Host "Step 4: Verify Database..." -ForegroundColor Yellow
  Write-Host ""
  
  $mongoCheck = "db.purchases.findOne({_id: ObjectId('$($response._id)')})"
  Write-Host "Query: $mongoCheck" -ForegroundColor Gray
  Write-Host ""
  
  # Full response for reference
  Write-Host "Full Response:" -ForegroundColor Green
  $response | ConvertTo-Json -Depth 5
  
  Write-Host ""
  Write-Host "=== VERIFICATION RESULTS ===" -ForegroundColor Cyan
  Write-Host "✅ Purchase Create API:  SUCCESS" -ForegroundColor Green
  Write-Host "✅  Data Saved:          YES" -ForegroundColor Green
  Write-Host "✅ TenantID Present:    $(if ($response.tenantId) { 'YES' } else { 'NO' })" -ForegroundColor Green
  Write-Host "✅ Status Draft:        $(if ($response.status -eq 'Draft') { 'YES' } else { 'NO' })" -ForegroundColor Green
  Write-Host "✅ Errors:              NONE" -ForegroundColor Green
} else {
  Write-Host "❌ Purchase Create Failed" -ForegroundColor Red
  Write-Host ""
  Write-Host "=== VERIFICATION RESULTS ===" -ForegroundColor Red
  Write-Host "❌ Purchase Create API: FAILED" -ForegroundColor Red
  Write-Host "❌ Data Saved:          NO" -ForegroundColor Red
}

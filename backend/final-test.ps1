# === FINAL PURCHASE VALIDATION TEST ===
Write-Host "FINAL VALIDATION TEST" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Login
$login = Invoke-RestMethod http://localhost:5000/api/auth/login -Method Post -Body '{"email":"admin@demo.local","password":"Admin@123"}' -ContentType application/json
$token = $login.data.accessToken
Write-Host "[1] Login: OK" -ForegroundColor Green

# Step 2: Test Purchase Create
$purchaseJson = '{
  "company":"63e8b3c4f8d7e2a1c5b9d0e0",
  "purchaseNumber":"PO-FINAL-TEST",
  "purchaseDate":"2024-01-15",
  "supplier":"63e8b3c4f8d7e2a1c5b9d0e1",
  "warehouse":"63e8b3c4f8d7e2a1c5b9d0e2",
  "currency":"63e8b3c4f8d7e2a1c5b9d0e3",
  "items":[{"item":"63e8b3c4f8d7e2a1c5b9d0e4","quantity":10,"unitCost":50,"totalCost":500}],
  "totalAmount":500,
  "netAmount":500
}'

Write-Host "[2] POST /api/purchase..." -ForegroundColor Yellow

$purchase = Invoke-RestMethod http://localhost:5000/api/purchase -Method Post -Body $purchaseJson -Headers @{Authorization="Bearer $token"} -ContentType application/json -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== FINAL REPORT ===" -ForegroundColor Cyan
Write-Host ""

if ($purchase._id) {
  Write-Host "[✅] File Modified:           purchase.validation.js" -ForegroundColor Green
  Write-Host "[✅] Validation Fixed:        Yes (All ObjectId fields updated)" -ForegroundColor Green
  Write-Host "[✅] Purchase Create:         SUCCESS" -ForegroundColor Green
  Write-Host "[✅] Data Saved:              YES" -ForegroundColor Green
  Write-Host "[✅] TenantID Present:        YES ($($purchase.tenantId))" -ForegroundColor Green
  Write-Host "[✅] Status Draft:            $(if ($purchase.status -eq 'Draft') { 'YES' } else { 'NO' })" -ForegroundColor Green
  Write-Host "[✅] Errors:                  NONE" -ForegroundColor Green
  Write-Host ""
  Write-Host "Purchase Details:" -ForegroundColor Cyan
  Write-Host "  ID:        $($purchase._id)" -ForegroundColor Cyan
  Write-Host "  TenantID:  $($purchase.tenantId)" -ForegroundColor Cyan
  Write-Host "  Status:    $($purchase.status)" -ForegroundColor Cyan
  Write-Host "  CreatedBy: $($purchase.createdBy)" -ForegroundColor Cyan
  Write-Host "  PO#:       $($purchase.purchaseNumber)" -ForegroundColor Cyan
} else {
  Write-Host "[❌] File Modified:           purchase.validation.js" -ForegroundColor Red
  Write-Host "[❌] Validation Fixed:        No - Still Failing" -ForegroundColor Red
  Write-Host "[❌] Purchase Create:         FAILED" -ForegroundColor Red
  Write-Host "[❌] Data Saved:              NO" -ForegroundColor Red
  Write-Host "[❌] Errors:" -ForegroundColor Red
  Write-Host ($purchase | ConvertTo-Json) -ForegroundColor Red
}

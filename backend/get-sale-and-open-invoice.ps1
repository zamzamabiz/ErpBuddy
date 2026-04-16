$body = @{
  email = "admin@demo.local"
  password = "Admin@123"
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$token = $login.data.accessToken

$sales = Invoke-RestMethod `
  -Uri "http://localhost:5000/api/sales" `
  -Headers @{ Authorization = "Bearer $token" }

# ✅ Correct IF block
if ($sales.Count -eq 0) {
  Write-Host "❌ No sales found. Please create a sale first." -ForegroundColor Red
  exit
}

# ✅ Correct saleId extraction
$saleId = $sales[0]._id

Write-Host ""
Write-Host "✅ SALE ID FOUND:" -ForegroundColor Green
Write-Host $saleId

Write-Host ""
Write-Host "👉 OPEN THIS IN BROWSER:" -ForegroundColor Cyan
Write-Host "http://localhost:5173/invoice/$saleId"
Write-Host ""
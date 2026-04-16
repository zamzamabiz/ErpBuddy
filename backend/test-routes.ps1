#!/usr/bin/env pwsh

$loginUrl = "http://localhost:5000/api/auth/login"
$loginBody = @{
    email = "admin@tenant1.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-WebRequest -uri $loginUrl -Method POST -ContentType "application/json" -Body $loginBody
$token = ($loginResponse.Content | ConvertFrom-Json).data.token

Write-Host "Token: $($token.Substring(0, 30))..."

# Test /stats (known working)
try {
    $statsResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/dashboard/stats" -Headers @{"Authorization" = "Bearer $token"} -Method GET
    Write-Host "✅ GET /api/dashboard/stats: $(($statsResponse.Content | ConvertFrom-Json).success)"
} catch {
    Write-Host "❌ GET /api/dashboard/stats: $($_.Exception.Response.StatusCode)"
}

# Test /summary (broken)
try {
    $summaryResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/dashboard/summary" -Headers @{"Authorization" = "Bearer $token"} -Method GET
    Write-Host "✅ GET /api/dashboard/summary: $(($summaryResponse.Content | ConvertFrom-Json).success)"
} catch {
    Write-Host "❌ GET /api/dashboard/summary: $($_.Exception.Response.StatusCode)"
}

# Test /trial-balance (other route)
try {
    $tbResponse = Invoke-WebRequest -Uri "http://localhost:5000/api/trial-balance" -Headers @{"Authorization" = "Bearer $token"} -Method GET
    Write-Host "✅ GET /api/trial-balance: $(($tbResponse.Content | ConvertFrom-Json).success)"
} catch {
    Write-Host "❌ GET /api/trial-balance: $($_.Exception.Response.StatusCode)"
}

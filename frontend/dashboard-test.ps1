#!/usr/bin/env pwsh

$BASE_URL = "http://localhost:5000/api"

Write-Host "`n==== DASHBOARD UI TEST ====" -ForegroundColor Cyan
Write-Host "`nStep 1: Login" -ForegroundColor Yellow

$LoginBody = @{
    email = "admin@demo.local"
    password = "password123"
} | ConvertTo-Json

try {
    $LoginResponse = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method POST -ContentType "application/json" -Body $LoginBody
    $Token = $LoginResponse.token
    Write-Host "✅ Login Success" -ForegroundColor Green
} catch {
    Write-Host "❌ Login Failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`nStep 2: Fetch Dashboard Stats" -ForegroundColor Yellow

$AuthHeader = @{ "Authorization" = "Bearer $Token"; "Content-Type" = "application/json" }

try {
    $Response = Invoke-RestMethod -Uri "$BASE_URL/dashboard/stats" -Method GET -Headers $AuthHeader
    Write-Host "✅ Dashboard Stats Fetched" -ForegroundColor Green
    
    if ($Response.data.summary) {
        Write-Host "`n📊 Financial Summary:" -ForegroundColor Cyan
        Write-Host "   Revenue:   $($Response.data.summary.revenue)" -ForegroundColor Green
        Write-Host "   Expenses:  $($Response.data.summary.expenses)" -ForegroundColor Red
        Write-Host "   Profit:    $($Response.data.summary.profit)" -ForegroundColor Blue
        Write-Host "   Cash:      $($Response.data.summary.cash)" -ForegroundColor Magenta
    } else {
        Write-Host "⚠️  No summary data found" -ForegroundColor Yellow
    }
    
    Write-Host "`n📈 System Stats:" -ForegroundColor Cyan
    Write-Host "   Tenants:   $($Response.data.tenants)" -ForegroundColor White
    Write-Host "   Companies: $($Response.data.companies)" -ForegroundColor White
    Write-Host "   Branches:  $($Response.data.branches)" -ForegroundColor White
    Write-Host "   Users:     $($Response.data.users)" -ForegroundColor White
} catch {
    Write-Host "❌ Failed to get stats: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ All tests passed!`n" -ForegroundColor Green


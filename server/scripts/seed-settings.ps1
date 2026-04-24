try {
    # Login and get token
    Write-Host "Logging in..." -ForegroundColor Yellow
    $loginBody = @{
        email = "admin@example.com"
        password = "admin123"
    } | ConvertTo-Json -Compress

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    $token = $loginResponse.token
    Write-Host "✓ Logged in successfully as admin" -ForegroundColor Green

    # Seed default settings
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    Write-Host "`nSeeding default settings..." -ForegroundColor Yellow
    $seedResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/settings/seed" `
        -Method Post `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "✓ Settings seeded successfully!" -ForegroundColor Green
    Write-Host "`nSummary:" -ForegroundColor Cyan
    Write-Host "  - Message: $($seedResponse.message)" -ForegroundColor White

    # Get all settings
    Write-Host "`nFetching all settings..." -ForegroundColor Yellow
    $allSettings = Invoke-RestMethod -Uri "http://localhost:5000/api/settings" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop

    Write-Host "`nTotal settings created: $($allSettings.count)" -ForegroundColor Green

    # Group by category
    $grouped = $allSettings | Group-Object -Property category
    foreach ($group in $grouped) {
        Write-Host "`n$($group.Name): $($group.Count) settings" -ForegroundColor Cyan
        foreach ($setting in $group.Group) {
            $systemFlag = if ($setting.isSystem) { "[SYSTEM]" } else { "" }
            Write-Host "  - $($setting.key): $($setting.labelEn) / $($setting.labelAr) $systemFlag" -ForegroundColor White
        }
    }

    Write-Host "`n✅ All done!" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Error occurred:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nStack Trace:" -ForegroundColor Yellow
    Write-Host $_.ScriptStackTrace -ForegroundColor Yellow
    exit 1
}

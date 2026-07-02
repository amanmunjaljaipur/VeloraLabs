# Verlin Labs — Google OAuth setup helper
Write-Host "`n=== Verlin Labs Google Auth Setup ===`n" -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot "..\.env.local"
$redirectUri = "http://localhost:3000/api/auth/callback/google"

Write-Host "1. Opening Google Cloud Console to create OAuth credentials..."
Write-Host "   Redirect URI to add: $redirectUri`n"

Start-Process "https://console.cloud.google.com/apis/credentials/oauthclient"

Write-Host "2. In Google Cloud Console:"
Write-Host "   - Application type: Web application"
Write-Host "   - Authorized redirect URI: $redirectUri"
Write-Host "   - Copy Client ID and Client Secret`n"

$clientId = Read-Host "Paste GOOGLE_CLIENT_ID"
$clientSecret = Read-Host "Paste GOOGLE_CLIENT_SECRET" -AsSecureString
$plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($clientSecret)
)

$content = Get-Content $envFile -Raw
$content = $content -replace "GOOGLE_CLIENT_ID=.*", "GOOGLE_CLIENT_ID=$clientId"
$content = $content -replace "GOOGLE_CLIENT_SECRET=.*", "GOOGLE_CLIENT_SECRET=$plainSecret"
Set-Content $envFile $content -NoNewline

Write-Host "`nSaved to .env.local. Restart dev server: npm run dev`n" -ForegroundColor Green
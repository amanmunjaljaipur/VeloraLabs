# Verlin Labs — Google Sheets setup (service account)
Write-Host "`n=== Verlin Labs Google Sheets Setup ===`n" -ForegroundColor Cyan

$envFile = Join-Path $PSScriptRoot "..\.env.local"
$projectRoot = Join-Path $PSScriptRoot ".."

Write-Host "This creates/updates a Google Sheet when someone books a free session."
Write-Host "You need a Google Cloud service account with Sheets + Drive API enabled.`n"

Write-Host "Step 1 — Enable APIs and create a service account"
Write-Host "  Opening Google Cloud Console...`n"
Start-Process "https://console.cloud.google.com/apis/library/sheets.googleapis.com"
Start-Sleep -Seconds 1
Start-Process "https://console.cloud.google.com/apis/library/drive.googleapis.com"
Start-Sleep -Seconds 1
Start-Process "https://console.cloud.google.com/iam-admin/serviceaccounts"

Write-Host "In Google Cloud Console:"
Write-Host "  1. Enable Google Sheets API and Google Drive API"
Write-Host "  2. IAM & Admin → Service Accounts → Create service account"
Write-Host "  3. Keys → Add key → JSON → download the file"
Write-Host "  4. Copy the service account email (ends with .iam.gserviceaccount.com)`n"

$jsonPath = Read-Host "Path to downloaded service-account JSON file"
if (-not (Test-Path $jsonPath)) {
  Write-Host "File not found: $jsonPath" -ForegroundColor Red
  exit 1
}

$secretsDir = Join-Path $projectRoot "secrets"
if (-not (Test-Path $secretsDir)) { New-Item -ItemType Directory -Path $secretsDir | Out-Null }
$destKey = Join-Path $secretsDir "google-service-account.json"
Copy-Item $jsonPath $destKey -Force

$parsed = Get-Content $destKey -Raw | ConvertFrom-Json
$defaultEmail = "amanmunjal.jaipur@gmail.com"
$shareInput = Read-Host "Google email to share the sheet with [$defaultEmail]"
$shareEmail = if ([string]::IsNullOrWhiteSpace($shareInput)) { $defaultEmail } else { $shareInput }

function Set-Or-Add-EnvLine($content, $key, $value) {
  if ($content -match "(?m)^$key=") {
    return ($content -replace "(?m)^$key=.*", "$key=$value")
  }
  return ($content.TrimEnd() + "`n$key=$value`n")
}

$content = if (Test-Path $envFile) { Get-Content $envFile -Raw } else { "" }
$content = Set-Or-Add-EnvLine $content "GOOGLE_SERVICE_ACCOUNT_KEY_FILE" "secrets/google-service-account.json"
$content = Set-Or-Add-EnvLine $content "GOOGLE_SHEETS_SHARE_EMAIL" $shareEmail
Set-Content $envFile $content -NoNewline

Write-Host "`nSaved key file to secrets/google-service-account.json" -ForegroundColor Green
Write-Host "Saved GOOGLE_SERVICE_ACCOUNT_KEY_FILE and GOOGLE_SHEETS_SHARE_EMAIL to .env.local" -ForegroundColor Green
Write-Host "Service account: $($parsed.client_email)`n"

Write-Host "Step 2 — Create the spreadsheet and test a booking row..."
Push-Location $projectRoot
npm run test:sheets
$testExit = $LASTEXITCODE
Pop-Location

if ($testExit -eq 0) {
  Write-Host "`nSheet is ready. Restart dev server: npm run dev" -ForegroundColor Green
  Write-Host "Add the same env vars to Vercel for production:`n"
  Write-Host "  npx vercel env add GOOGLE_SERVICE_ACCOUNT_JSON production  (paste JSON contents)"
  Write-Host "  npx vercel env add GOOGLE_SHEETS_SHARE_EMAIL production`n"
} else {
  Write-Host "`nTest failed — check API enablement and service account JSON." -ForegroundColor Yellow
}
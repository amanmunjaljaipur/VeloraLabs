$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

Write-Host "Checking Vercel authentication..."
npx vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Not logged in. Run: npx vercel login"
    exit 1
}

if (-not (Test-Path ".env.local")) {
    Write-Host "Missing .env.local — copy from .env.example and fill in values."
    exit 1
}

Write-Host "Linking Vercel project..."
npx vercel link --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Syncing environment variables from .env.local..."
Get-Content ".env.local" | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }

    $eq = $line.IndexOf("=")
    if ($eq -lt 1) { return }

    $name = $line.Substring(0, $eq).Trim()
    $value = $line.Substring($eq + 1).Trim()
    if (-not $name -or -not $value) { return }

    # Local auth URL must not overwrite production OAuth redirects.
    if ($name -eq "AUTH_URL" -and $value -match "localhost") {
        $value = "https://velora-labs-gamma.vercel.app"
        Write-Host "  ~ $name (mapped to production URL)"
    }

    foreach ($target in @("production", "preview", "development")) {
        npx vercel env rm $name $target --yes 2>$null | Out-Null
        $value | npx vercel env add $name $target 2>$null | Out-Null
    }
    Write-Host "  + $name"
}

Write-Host "Deploying to production..."
npx vercel --prod --yes
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Deployment complete."
Write-Host "Update Google OAuth redirect URI to: https://YOUR_DOMAIN/api/auth/callback/google"
Write-Host "Set AUTH_URL in Vercel env to your production URL, then redeploy if auth fails."
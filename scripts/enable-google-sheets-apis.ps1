# Opens Google Cloud Console for the Velora Labs OAuth project.
# Project number from GOOGLE_CLIENT_ID: 469433742409

$project = "469433742409"
Write-Host "`nOpening Google Cloud Console for project $project ...`n" -ForegroundColor Cyan
Write-Host "Enable these APIs (click ENABLE on each page):"
Write-Host "  - Google Sheets API"
Write-Host "  - Google Drive API`n"
Write-Host "Then create a service account key (JSON) and run:"
Write-Host "  .\scripts\setup-google-sheets.ps1`n"

Start-Process "https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=$project"
Start-Sleep -Seconds 1
Start-Process "https://console.cloud.google.com/apis/library/drive.googleapis.com?project=$project"
Start-Sleep -Seconds 1
Start-Process "https://console.cloud.google.com/iam-admin/serviceaccounts?project=$project"
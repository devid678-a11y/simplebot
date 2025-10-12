# PowerShell script to get SHA-1 fingerprint for Google Maps API

Write-Host "Getting SHA-1 fingerprint for Google Maps API..." -ForegroundColor Green

# Try to find the debug keystore
$debugKeystore = "$env:USERPROFILE\.android\debug.keystore"

if (Test-Path $debugKeystore) {
    Write-Host "Found debug keystore at: $debugKeystore" -ForegroundColor Yellow
    
    # Get SHA-1 fingerprint
    $result = keytool -list -v -keystore $debugKeystore -alias androiddebugkey -storepass android -keypass android 2>$null
    
    if ($result) {
        $sha1 = ($result | Select-String "SHA1:").ToString().Split(":")[1].Trim()
        Write-Host "`nSHA-1 Fingerprint: $sha1" -ForegroundColor Cyan
        Write-Host "`nCopy this fingerprint to Google Cloud Console:" -ForegroundColor Yellow
        Write-Host "1. Go to Google Cloud Console" -ForegroundColor White
        Write-Host "2. Select your project" -ForegroundColor White
        Write-Host "3. Go to Credentials" -ForegroundColor White
        Write-Host "4. Edit your API key" -ForegroundColor White
        Write-Host "5. Add this SHA-1 to Android app restrictions" -ForegroundColor White
        Write-Host "6. Package name: com.company.dvizhtrue" -ForegroundColor White
    } else {
        Write-Host "Failed to get SHA-1 fingerprint" -ForegroundColor Red
    }
} else {
    Write-Host "Debug keystore not found at: $debugKeystore" -ForegroundColor Red
    Write-Host "Please run this command manually:" -ForegroundColor Yellow
    Write-Host "keytool -list -v -keystore %USERPROFILE%\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android" -ForegroundColor White
}

Write-Host "`nPress any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

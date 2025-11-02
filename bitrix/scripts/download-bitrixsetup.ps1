$ErrorActionPreference = "Stop"
New-Item -ItemType Directory -Force -Path "$PSScriptRoot/../www" | Out-Null
$url = "https://www.1c-bitrix.ru/download/scripts/bitrixsetup.php"
$dst = Join-Path "$PSScriptRoot/../www" "bitrixsetup.php"
Invoke-WebRequest -Uri $url -OutFile $dst
Write-Host "bitrixsetup.php скачан: $dst"


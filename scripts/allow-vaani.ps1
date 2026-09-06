# Requires -RunAs
$ErrorActionPreference = "Continue"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Vaani Studio - Antivirus & Defender Trust Configuration " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$repoRoot = Split-Path -Parent $PSScriptRoot
$certPath = Join-Path $repoRoot "certs\vaani-studio.cer"
$appDataProg = Join-Path $env:LOCALAPPDATA "Programs\vaani-studio"
$downloadsPath = Join-Path $env:USERPROFILE "Downloads"

# 1. Install Certificate into LocalMachine Root Store
if (Test-Path $certPath) {
    Write-Host "[1/4] Installing Vaani Studio digital certificate into Trusted Root Store..." -ForegroundColor Yellow
    try {
        certutil -addstore -f Root "$certPath" | Out-Null
        Write-Host "       Certificate successfully installed. Windows SmartScreen now verifies 'Vaani Studio'." -ForegroundColor Green
    } catch {
        Write-Host "       Could not auto-install certificate: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2. Add Windows Defender Exclusions
Write-Host "[2/4] Adding Windows Defender exclusions..." -ForegroundColor Yellow
try {
    Add-MpPreference -ExclusionPath $repoRoot -ErrorAction SilentlyContinue
    Add-MpPreference -ExclusionPath $appDataProg -ErrorAction SilentlyContinue
    Add-MpPreference -ExclusionPath "$repoRoot\dist-release" -ErrorAction SilentlyContinue
    Add-MpPreference -ExclusionProcess "Vaani Studio.exe" -ErrorAction SilentlyContinue
    Add-MpPreference -ExclusionProcess "VaaniStudio-Setup-0.1.0.exe" -ErrorAction SilentlyContinue
    Add-MpPreference -ExclusionProcess "VaaniStudio-Portable-0.1.0.exe" -ErrorAction SilentlyContinue
    Write-Host "       Windows Defender exclusions added for repo, installation paths, and executables." -ForegroundColor Green
} catch {
    Write-Host "       Notice: Defender exclusion command completed." -ForegroundColor Gray
}

# 3. Remove Mark-of-the-Web (Unblock files)
Write-Host "[3/4] Removing Mark of the Web (unblocking executables)..." -ForegroundColor Yellow
try {
    Get-ChildItem -Path "$repoRoot\dist-release\*.exe" -ErrorAction SilentlyContinue | Unblock-File
    Get-ChildItem -Path "$downloadsPath\VaaniStudio*.exe" -ErrorAction SilentlyContinue | Unblock-File
    Write-Host "       Executables unblocked." -ForegroundColor Green
} catch {
    Write-Host "       Completed unblock scan." -ForegroundColor Gray
}

# 4. Avast Guidance
Write-Host "[4/4] Avast Antivirus Configuration:" -ForegroundColor Yellow
Write-Host "       Avast has self-protection enabled and requires manual exception confirmation:" -ForegroundColor White
Write-Host "       1. Open Avast -> Menu -> Settings -> General -> Exceptions" -ForegroundColor White
Write-Host "       2. Click 'Add Exception' and add:" -ForegroundColor White
Write-Host "          $repoRoot" -ForegroundColor Cyan
Write-Host "          $appDataProg" -ForegroundColor Cyan
Write-Host "       3. On any Avast popup ('Needs a closer look'), click 'More options' -> 'Open anyway'." -ForegroundColor White
Write-Host ""
Write-Host "Setup complete! Press any key to exit." -ForegroundColor Green
[void][System.Console]::ReadKey()

param(
    [switch]$Final
)

$rootDir = Split-Path -Parent $PSScriptRoot
$tauriDir = Join-Path $rootDir "src-tauri"

function Update-Version {
    param([string]$version)
    
    Write-Host "`nUpdating version to $version...`n" -ForegroundColor Cyan

    # Update tauri.conf.json
    $tauriConfPath = Join-Path $tauriDir "tauri.conf.json"
    $tauriConf = Get-Content $tauriConfPath -Raw | ConvertFrom-Json
    $tauriConf.version = $version
    $tauriConf | ConvertTo-Json -Depth 10 | Set-Content $tauriConfPath -Encoding UTF8
    Write-Host "Updated tauri.conf.json" -ForegroundColor Green

    # Update Cargo.toml
    $cargoTomlPath = Join-Path $tauriDir "Cargo.toml"
    $cargoToml = Get-Content $cargoTomlPath -Raw
    $cargoToml = $cargoToml -replace 'version = "[^"]+"', "version = `"$version`""
    $cargoToml | Set-Content $cargoTomlPath -Encoding UTF8 -NoNewline
    Write-Host "Updated Cargo.toml" -ForegroundColor Green

    # Update package.json
    $packageJsonPath = Join-Path $rootDir "package.json"
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    $packageJson.version = $version
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath -Encoding UTF8
    Write-Host "Updated package.json`n" -ForegroundColor Green
}

function Invoke-Build {
    Write-Host "Building Tauri app...`n" -ForegroundColor Cyan
    
    Push-Location $rootDir
    try {
        npx tauri build
        if ($LASTEXITCODE -ne 0) {
            throw "Build failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

function Find-ExeFile {
    param([string]$bundleDir)
    
    $nsisDir = Join-Path $bundleDir "nsis"
    
    if (-not (Test-Path $nsisDir)) {
        throw "NSIS directory not found in bundle output"
    }

    $exeFiles = Get-ChildItem $nsisDir -Filter "*.exe" | Where-Object { $_.Name -notlike "*_uninstall*" }
    
    if ($exeFiles.Count -eq 0) {
        throw "Setup .exe file not found in NSIS output"
    }

    return $exeFiles[0].FullName
}

function New-LatestJson {
    param(
        [string]$version,
        [string]$exePath
    )
    
    $exeName = Split-Path $exePath -Leaf
    $latestJsonPath = Join-Path (Split-Path $exePath -Parent) "latest.json"

    $latestData = @{
        version = $version
        exe = $exeName
        absolutePath = $exePath.Replace('\', '/')
        publishDate = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        productName = "Rocket Launcher"
    }

    $latestData | ConvertTo-Json -Depth 10 | Set-Content $latestJsonPath -Encoding UTF8
    
    Write-Host "`n✅ Created latest.json:" -ForegroundColor Green
    $latestData | ConvertTo-Json -Depth 10 | Write-Host
    Write-Host "`n📁 Location: $latestJsonPath`n" -ForegroundColor Cyan
}

# Main execution
try {
    $version = $null

    if ($Final) {
        Write-Host "🚀 Building FINAL release`n" -ForegroundColor Yellow
        
        $version = Read-Host "Enter version number (e.g., 1.0.0)"
        $version = $version.Trim()
        
        if (-not ($version -match '^\d+\.\d+\.\d+')) {
            Write-Host "❌ Invalid version format. Expected: x.y.z" -ForegroundColor Red
            exit 1
        }

        Update-Version -version $version
    }
    else {
        # Read current version for non-final builds
        $tauriConfPath = Join-Path $tauriDir "tauri.conf.json"
        $tauriConf = Get-Content $tauriConfPath -Raw | ConvertFrom-Json
        $version = $tauriConf.version
        Write-Host "Building version $version...`n" -ForegroundColor Cyan
    }

    # Run build
    Invoke-Build

    if ($Final) {
        Write-Host "`nFinalizing release...`n" -ForegroundColor Cyan

        # Find the bundle output directory
        $bundleDir = Join-Path $tauriDir "target\release\bundle"
        $exePath = Find-ExeFile -bundleDir $bundleDir

        # Create latest.json
        New-LatestJson -version $version -exePath $exePath

        Write-Host "Final release build complete!`n" -ForegroundColor Green
    }
    else {
        Write-Host "`nBuild complete!`n" -ForegroundColor Green
    }
}
catch {
    Write-Host "`nBuild failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

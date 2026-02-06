# Create Distribution Package
# This script creates a distributable zip file of the Recall Knowledge module
# and optionally installs it to your FoundryVTT modules directory

Write-Host "Creating Recall Knowledge Module Package..." -ForegroundColor Green

# Set paths
$packagePath = "c:\Everything4Everybody\recall-knowledge\package"
$testsSourcePath = "c:\Everything4Everybody\recall-knowledge\tests"
$testsDestPath = Join-Path $packagePath "tests"
$zipPath = "c:\Everything4Everybody\recall-knowledge\recall-knowledge-v1.0.0.zip"
$foundryModulesPath = "C:\Users\tevwo\AppData\Local\FoundryVTT\Data\modules"
$moduleInstallPath = Join-Path $foundryModulesPath "recall-knowledge"

# Check if package directory exists
if (-not (Test-Path $packagePath)) {
    Write-Host "Error: Package directory not found at $packagePath" -ForegroundColor Red
    exit 1
}

# Copy test files to package if they exist
if (Test-Path $testsSourcePath) {
    Write-Host "Copying test files to package..." -ForegroundColor Cyan
    if (Test-Path $testsDestPath) {
        Remove-Item $testsDestPath -Recurse -Force
    }
    Copy-Item $testsSourcePath -Destination $testsDestPath -Recurse
    Write-Host "Test files copied successfully" -ForegroundColor Green
}

# Remove existing zip if it exists
if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
    Write-Host "Removed existing zip file" -ForegroundColor Yellow
}

# Create zip archive
try {
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($packagePath, $zipPath)
    Write-Host "Successfully created package: $zipPath" -ForegroundColor Green
    
    # Display package info
    $zipInfo = Get-Item $zipPath
    Write-Host "Package size: $([math]::Round($zipInfo.Length / 1KB, 2)) KB" -ForegroundColor Cyan
    Write-Host "Package location: $zipPath" -ForegroundColor Cyan
    
}
catch {
    Write-Host "Error creating zip package: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nPackage created successfully!" -ForegroundColor Green

# Copy to FoundryVTT modules directory
Write-Host "`nInstalling to FoundryVTT..." -ForegroundColor Green

try {
    # Create modules directory if it doesn't exist
    if (-not (Test-Path $foundryModulesPath)) {
        Write-Host "FoundryVTT modules directory not found at: $foundryModulesPath" -ForegroundColor Yellow
        Write-Host "Skipping installation. You can manually copy the package folder to your modules directory." -ForegroundColor Yellow
    }
    else {
        # Remove existing module installation if it exists
        if (Test-Path $moduleInstallPath) {
            Remove-Item $moduleInstallPath -Recurse -Force
            Write-Host "Removed existing installation" -ForegroundColor Yellow
        }
        
        # Copy package folder to modules directory
        Copy-Item -Path $packagePath -Destination $moduleInstallPath -Recurse -Force
        Write-Host "Successfully installed module to: $moduleInstallPath" -ForegroundColor Green
        
        Write-Host "`nModule is ready to use!" -ForegroundColor Green
        Write-Host "1. Launch FoundryVTT" -ForegroundColor White
        Write-Host "2. Go to Game Worlds -> Configure Settings -> Manage Modules" -ForegroundColor White
        Write-Host "3. Enable 'Recall Knowledge'" -ForegroundColor White
    }
}
catch {
    Write-Host "Error installing to FoundryVTT: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can manually copy the package folder to your modules directory." -ForegroundColor Yellow
}

Write-Host "`nDistribution zip: $zipPath" -ForegroundColor Cyan
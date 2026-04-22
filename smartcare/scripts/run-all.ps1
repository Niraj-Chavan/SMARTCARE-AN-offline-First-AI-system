param(
  [switch]$SkipInstall,
  [switch]$SkipTests,
  [switch]$SkipE2E,
  [switch]$SkipBuild,
  [switch]$SkipPreview
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir
Set-Location $projectRoot

function Run-Step($label, $command) {
  Write-Host "\n==> $label" -ForegroundColor Cyan
  & $command
}

if (-not $SkipInstall) {
  if (-not (Test-Path "node_modules")) {
    Run-Step "Install dependencies" { npm install }
  } else {
    Write-Host "\n==> Dependencies already installed (node_modules exists)" -ForegroundColor DarkGray
  }
}

if (-not $SkipTests) {
  Run-Step "Run unit tests" { npm run test -- --run }
}

if (-not $SkipBuild) {
  Run-Step "Build" { npm run build }
}

if (-not $SkipE2E) {
  Run-Step "Run e2e tests" { npm run e2e }
}

if (-not $SkipPreview) {
  Run-Step "Start preview server" { npm run preview }
}

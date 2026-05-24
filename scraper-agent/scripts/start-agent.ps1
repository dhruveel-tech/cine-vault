$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $PSScriptRoot
$AgentDir = Join-Path $Root "scraper-agent"
$VenvActivate = Join-Path $AgentDir ".venv\Scripts\Activate.ps1"

if (!(Test-Path $AgentDir)) {
  throw "scraper-agent folder was not found. Run this script from the CineVault project."
}

if (Test-Path $VenvActivate) {
  . $VenvActivate
}
else {
  Write-Host "No scraper-agent virtual environment found. Create one with:" -ForegroundColor Yellow
  Write-Host "cd scraper-agent; python -m venv .venv; .venv\Scripts\activate; pip install -r requirements.txt" -ForegroundColor Yellow
}

Set-Location $Root
uvicorn main:app --reload --host 127.0.0.1 --port 8000

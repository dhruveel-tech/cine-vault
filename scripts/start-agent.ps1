$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "Starting CineVault scraper agent from $ProjectRoot" -ForegroundColor Cyan
uvicorn main:app --reload --host 127.0.0.1 --port 8000

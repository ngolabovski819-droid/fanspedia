# Converts OnlyFans cookies from clipboard → Playwright format → runs scanner
param(
  [Parameter(Mandatory=$false)] [long]$CreatorId = 402490649,
  [Parameter(Mandatory=$false)] [string]$ExportPath = "$env:USERPROFILE\fanspedia\cookies_export.json",
  [Parameter(Mandatory=$false)] [string]$CookiesPath = "$env:USERPROFILE\fanspedia\cookies.json"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Convert-SameSite([string]$v) {
  if (-not $v) { return 'Lax' }
  switch ($v.ToLower()) {
    'no_restriction' { return 'None' }
    'none'           { return 'None' }
    'strict'         { return 'Strict' }
    default          { return 'Lax' }
  }
}

function Get-Prop($obj, [string]$name, $default=$null) {
  if ($null -eq $obj) { return $default }
  $p = $obj.PSObject.Properties[$name]
  if ($p) { return $p.Value }
  return $default
}

function Get-UnixNow() {
  [int][Math]::Floor((New-TimeSpan -Start ([datetime]'1970-01-01') -End (Get-Date)).TotalSeconds)
}

Write-Host "Step 1/3: Reading cookies JSON from clipboard..." -ForegroundColor Cyan
$clip = Get-Clipboard -Raw
if (-not $clip) { throw "Clipboard is empty. Copy your cookies JSON first, then run again." }

try { $parsed = $clip | ConvertFrom-Json } catch { throw "Clipboard does not contain valid JSON. Paste the cookies JSON and retry." }
if (-not ($parsed -is [System.Collections.IEnumerable])) { throw "Expected an array of cookies in JSON." }

New-Item -ItemType Directory -Path (Split-Path $ExportPath) -Force | Out-Null
New-Item -ItemType Directory -Path (Split-Path $CookiesPath) -Force | Out-Null

Set-Content -Path $ExportPath -Value $clip -Encoding UTF8
Write-Host "Saved raw export -> $ExportPath" -ForegroundColor Green

Write-Host "Step 2/3: Converting to Playwright format..." -ForegroundColor Cyan
$now = Get-UnixNow
$out = @()
foreach ($c in $parsed) {
  $name  = Get-Prop $c 'name'
  $value = Get-Prop $c 'value'
  $domain = Get-Prop $c 'domain' '.onlyfans.com'
  $path = Get-Prop $c 'path' '/'
  $exp = Get-Prop $c 'expirationDate' (Get-Prop $c 'expires')
  if ($exp) { $expires = [int][Math]::Floor([double]$exp) } else { $expires = $now + (90*24*3600) }
  $httpOnly = [bool]((Get-Prop $c 'httpOnly' $false) -or (Get-Prop $c 'httponly' $false))
  $secure = $true
  $sameSiteRaw = Get-Prop $c 'sameSite' (Get-Prop $c 'samesite')
  $sameSite = Convert-SameSite $sameSiteRaw

  $out += [pscustomobject]@{
    name=$name; value=$value; domain=$domain; path=$path;
    expires=$expires; httpOnly=$httpOnly; secure=$secure; sameSite=$sameSite
  }
}

$out = $out | Where-Object { $_.domain -like '*.onlyfans.com' -or $_.domain -eq 'onlyfans.com' }
$json = $out | ConvertTo-Json -Depth 6
# Write without BOM to avoid JSONDecodeError in Python
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($CookiesPath, $json, $utf8NoBom)
Write-Host "Wrote $($out.Count) cookies -> $CookiesPath" -ForegroundColor Green

Write-Host "Step 3/3: Running scanner for CreatorId=$CreatorId ..." -ForegroundColor Cyan
$scanner = "c:\Users\nickg\fanspedia\scripts\v2_id_scanner.py"
if (-not (Test-Path $scanner)) { throw "Scanner not found at $scanner" }

python $scanner --cookies $CookiesPath --start-id $CreatorId --end-id $CreatorId

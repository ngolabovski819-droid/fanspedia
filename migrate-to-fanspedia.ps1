<#
FansPedia Migration Script
Replaces domain & branding strings in project files.
Safe to re-run; counts total replacements.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'Starting FansPedia migration...' -ForegroundColor Cyan

$files = @(
  'index.html','categories.html','category.html','creator.html',
  'api/creator/[...params].js','api/creator/[...username].js',
  'api/creator.js','api/index.js','api/categories.js',
  'scripts/generate-sitemap.cjs','scripts/build-sitemaps.cjs',
  'robots.txt','.github/copilot-instructions.md','.github/CHECKLISTS.md',
  '.github/README.md','.github/QUICKSTART.md','.github/ARCHITECTURE.md',
  '.github/PATTERNS.md','.github/TROUBLESHOOTING.md'
)

@('public/robots.txt','creator.html.backup','creator_temp_backup.html') | ForEach-Object {
  if (Test-Path $_) { $files += $_ }
}

$replacements = [ordered]@{
  'bestonlyfansgirls.net' = 'fanspedia.net'
  'BestOnlyFansGirls'     = 'FansPedia'
  'BestOFGirls'           = 'FansPedia'
}

$totalChanges = 0
$filesModified = 0

foreach ($file in $files) {
  if (-not (Test-Path -LiteralPath $file)) {
    Write-Host "[skip] $file (not found)" -ForegroundColor DarkGray
    continue
  }
  $content = Get-Content -LiteralPath $file -Raw -Encoding UTF8
  $original = $content
  $fileChangeCount = 0
  foreach ($old in $replacements.Keys) {
    $new = $replacements[$old]
    $count = ([regex]::Matches($content,[regex]::Escape($old))).Count
    if ($count -gt 0) {
      $content = $content -replace [regex]::Escape($old), $new
      Write-Host "  $($file): $old -> $new ($count)" -ForegroundColor Green
      $totalChanges += $count
      $fileChangeCount += $count
    }
  }
  if ($content -ne $original) {
    Set-Content -LiteralPath $file -Value $content -Encoding UTF8 -NoNewline
    $filesModified++
  } elseif ($fileChangeCount -eq 0) {
    Write-Host "  $($file): no changes" -ForegroundColor Gray
  }
}

Write-Host ''
Write-Host 'Migration complete.' -ForegroundColor Cyan
Write-Host "Files modified: $filesModified" -ForegroundColor Yellow
Write-Host "Total replacements: $totalChanges" -ForegroundColor Yellow
Write-Host ''
Write-Host 'Next:' -ForegroundColor Cyan
Write-Host ' git diff' -ForegroundColor White
Write-Host ' git add -A' -ForegroundColor White
Write-Host " git commit -m 'chore: migrate to FansPedia branding'" -ForegroundColor White
Write-Host ' git remote add origin https://github.com/your-username/fanspedia.git' -ForegroundColor White
Write-Host ' git push -u origin main' -ForegroundColor White

{
  "version": 2,
  "rewrites": [
    { "source": "/", "destination": "/index.html" }
  ]
}

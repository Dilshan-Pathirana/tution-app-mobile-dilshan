$ErrorActionPreference = 'Stop'

$repoRoot = (Get-Location)
$envPath = Join-Path $repoRoot 'backend\.env'
$outPath = Join-Path $repoRoot 'backend\.cloudrun.env.json'

if (!(Test-Path $envPath)) {
  throw "backend/.env missing at: $envPath"
}

$lines = Get-Content $envPath

$match = $lines | Select-String -Pattern '^\s*DATABASE_URL\s*=' | Select-Object -First 1
if (-not $match) {
  throw 'DATABASE_URL line missing in backend/.env'
}

$index = $match.LineNumber - 1
$databaseUrl = ($lines[$index] -replace '^\s*DATABASE_URL\s*=\s*', '').Trim()

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
  throw 'DATABASE_URL is empty in backend/.env'
}

$prefix = 'postgresql://'
if (!$databaseUrl.StartsWith($prefix)) {
  throw 'DATABASE_URL must start with postgresql://'
}

$rest = $databaseUrl.Substring($prefix.Length)
$colonPos = $rest.IndexOf(':')
$atPos = $rest.IndexOf('@')
if ($colonPos -lt 1 -or $atPos -lt ($colonPos + 2)) {
  throw 'DATABASE_URL must be postgresql://user:pass@host:port/db'
}

$user = $rest.Substring(0, $colonPos)
$pass = $rest.Substring($colonPos + 1, $atPos - $colonPos - 1)
$hostPart = $rest.Substring($atPos + 1)

# URL-encode password so characters like %, /, @, : are safe in a URI
$encodedPass = [System.Uri]::EscapeDataString($pass)
$fixedUrl = "${prefix}${user}:${encodedPass}@${hostPart}"

$lines[$index] = "DATABASE_URL=$fixedUrl"
Set-Content -Path $envPath -Value $lines -Encoding utf8

# Build env dict excluding reserved PORT
$dict = @{}
Get-Content $envPath | ForEach-Object {
  $line = $_.Trim()
  if (!$line -or $line.StartsWith('#')) { return }
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$') {
    $key = $Matches[1]
    if ($key -eq 'PORT') { return }
    $value = $Matches[2]
    if (($value.StartsWith('"') -and $value.EndsWith('"')) -or ($value.StartsWith("'") -and $value.EndsWith("'"))) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    $dict[$key] = $value
  }
}

$dict['NODE_ENV'] = 'production'

$dict | ConvertTo-Json -Depth 3 | Set-Content -Path $outPath -Encoding utf8

$result = Get-Content $outPath -Raw | ConvertFrom-Json
$u = $result.DATABASE_URL
Write-Output ("Generated backend/.cloudrun.env.json. DATABASE_URL length=" + $u.Length)

try {
  [Uri]$u | Out-Null
  Write-Output 'DATABASE_URL parses OK'
} catch {
  throw ('DATABASE_URL still invalid: ' + $_.Exception.Message)
}

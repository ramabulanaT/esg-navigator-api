[CmdletBinding()]
param(
  [Parameter(Mandatory=$true)][string]$Url,
  [string]$ExpectApi = ""
)
$ErrorActionPreference = 'Stop'

function Get-Json {
  param([string]$U)
  try {
    $r = Invoke-WebRequest -Uri $U -TimeoutSec 12 -UseBasicParsing
    $ct = [string]$r.Headers['Content-Type']
    $json = $null
    if ($ct -and $ct -like '*application/json*') { $json = $r.Content | ConvertFrom-Json -ErrorAction Stop }
    return @{ ok = ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400); code = $r.StatusCode; json = $json; text = $r.Content; ct = $ct }
  } catch {
    $code = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) { $code = [int]$_.Exception.Response.StatusCode }
    return @{ ok = $false; code = $code; json = $null; text = $_.Exception.Message; ct = $null }
  }
}

function Result {
  param([string]$Name, [bool]$Ok, [string]$Info)
  if ($Ok) { $color='Green'; $prefix='OK   ' } else { $color='Red'; $prefix='FAIL ' }
  Write-Host ($prefix + $Name + ' ' + $Info) -ForegroundColor $color
}

if ($Url -notmatch '^https?://') { $Url = 'https://' + $Url }
$Url = $Url.TrimEnd('/')

Write-Host ('Checking: ' + $Url) -ForegroundColor Cyan
if ($ExpectApi) { Write-Host ('Expected API: ' + $ExpectApi) -ForegroundColor DarkCyan }

# 1) Homepage data route (should exist even without backend)
$uData = $Url + '/api/app-suppliers'
$d = Get-Json $uData
$hasDataRoute = $d.ok -and $d.json -ne $null -and (($d.json | Measure-Object).Count -ge 1)
Result '/api/app-suppliers' $hasDataRoute ('code=' + ($d.code))

# 2) Secure proxy (401 allowed: missing API_PROXY_KEY)
$uProxy = $Url + '/api/proxy/api/suppliers'
$p = Get-Json $uProxy
$proxyOk = $p.ok -and $p.json -ne $null
$proxy401 = (-not $p.ok) -and ($p.code -eq 401)
$infoProxy = 'code=' + ($p.code) + ($(if($proxy401){' (set API_PROXY_KEY)'} else {''}))
Result '/api/proxy/api/suppliers' ($proxyOk -or $proxy401) $infoProxy

# 3) Health rewrite (verifies next.config and Root Directory)
$uHealth = $Url + '/health'
$h = Get-Json $uHealth
$healthOk = $h.ok -and $h.json -ne $null
Result '/health rewrite' $healthOk ('code=' + ($h.code))

# 4) Homepage has "Suppliers"
try {
  $home = Invoke-WebRequest -Uri ($Url + '/') -TimeoutSec 12 -UseBasicParsing
  $homeOk = ($home.StatusCode -ge 200 -and $home.StatusCode -lt 400)
  $hasTitle = ($home.Content -match 'Suppliers')
  Result 'Homepage reachable' $homeOk ('code=' + $home.StatusCode)
  Result "Homepage contains 'Suppliers'" $hasTitle ''
} catch {
  Result 'Homepage reachable' $false $_.Exception.Message
}

Write-Host ''
if (-not $hasDataRoute) {
  Write-Host 'Cause: Missing route or wrong Vercel Root Directory.' -ForegroundColor Yellow
  Write-Host 'Fix: Set Root Directory to apps/web; ensure apps/web/app/api/app-suppliers/route.ts exists; redeploy.' -ForegroundColor Gray
}
if ($proxy401) {
  Write-Host 'Cause: Proxy secret not set.' -ForegroundColor Yellow
  Write-Host 'Fix: In Vercel env, set API_BASE and API_PROXY_KEY (must match backend PROXY_SHARED_SECRET); redeploy.' -ForegroundColor Gray
}
if (-not $healthOk) {
  Write-Host 'Cause: next.config.mjs rewrites not applied OR wrong Root Directory.' -ForegroundColor Yellow
  Write-Host 'Fix: apps/web/next.config.mjs must define rewrites; deploy from apps/web; redeploy.' -ForegroundColor Gray
}
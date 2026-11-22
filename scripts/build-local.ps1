# Local Android APK build for Windows.
#
# Based on BBPlayer's scripts/build-local.ps1 (MIT, Copyright (c) 2025 Roitium).
#
# Why a separate work dir: CMake/ninja object paths get very long, so the build must
# run from a SHORT path (default C:\s) with a hoisted node_modules layout, and Windows
# long paths must be enabled (LongPathsEnabled=1) with a ninja >= 1.12.
#
# Usage (from any PowerShell):
#   .\scripts\build-local.ps1             # release APK, arm64-v8a
#   .\scripts\build-local.ps1 -Prebuild   # force regenerating the android/ project
#
# First-time setup of the work dir (once):
#   - copy this repo (without node_modules and .git) to $Work
#   - cd $Work; corepack pnpm install --ignore-scripts --no-frozen-lockfile
#
# Release signing (optional, keys never go into the repo). Put these in ~/.gradle/gradle.properties:
#   SIRENPLAYER_STORE_FILE=C:/Users/xxx/.sirenplayer/sirenplayer-release.jks
#   SIRENPLAYER_STORE_PASSWORD=...
#   SIRENPLAYER_KEY_ALIAS=sirenplayer
#   SIRENPLAYER_KEY_PASSWORD=...
# Without them the APK is signed with the Expo debug key.
param(
	[string]$Work = 'C:\s',
	[string]$Abi = 'arm64-v8a',
	[switch]$Prebuild
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$jbr = 'C:\Program Files\Android\Android Studio\jbr'
$ninja = Join-Path $sdk 'cmake\3.22.1\bin\ninja.exe'

# ---- preflight checks -------------------------------------------------------
if (-not (Test-Path (Join-Path $Work 'node_modules'))) {
	throw "Work dir '$Work' has no node_modules. See the setup notes at the top of this script."
}
$longPaths = (Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem' -Name LongPathsEnabled -ErrorAction SilentlyContinue).LongPathsEnabled
if ($longPaths -ne 1) {
	throw 'Windows long paths are disabled. Run as admin: Set-ItemProperty ''HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem'' -Name LongPathsEnabled -Value 1  (then reboot)'
}
if (Test-Path $ninja) {
	$ninjaVersion = (& $ninja --version).Trim()
	if ([version]($ninjaVersion -replace '[^\d\.].*$', '') -lt [version]'1.12') {
		throw "ninja $ninjaVersion is too old for long paths (need >= 1.12): $ninja"
	}
}

# ---- sync sources into the short work dir -----------------------------------
foreach ($rel in @('src', 'modules', 'expo-plugins', 'assets')) {
	robocopy (Join-Path $repo $rel) (Join-Path $Work $rel) /MIR /XD build .cxx .gradle /NFL /NDL /NJH /NJS /NP | Out-Null
	if ($LASTEXITCODE -ge 8) { throw "robocopy failed for $rel ($LASTEXITCODE)" }
}
$global:LASTEXITCODE = 0

foreach ($file in @('app.config.ts', 'package.json', 'tsconfig.json', 'babel.config.js', 'metro.config.js')) {
	Copy-Item (Join-Path $repo $file) (Join-Path $Work $file) -Force
}

# versionCode: number of commits in the real repository (the work dir has no git history)
$ErrorActionPreference = 'Continue'
$commitCount = (git -C $repo rev-list --count HEAD 2>$null)
if ($LASTEXITCODE -eq 0 -and $commitCount) { $env:VERSION_CODE = $commitCount.Trim() }
$ErrorActionPreference = 'Stop'
$global:LASTEXITCODE = 0

# ---- environment ------------------------------------------------------------
$env:JAVA_HOME = $jbr.Replace('\', '/')
$env:ANDROID_HOME = $sdk.Replace('\', '/')
$env:ABI_FILTERS = $Abi
$env:NODE_ENV = 'production'
$env:CI = '1'

$android = Join-Path $Work 'android'
$marker = Join-Path $Work '.build-abi'

# ---- prebuild when needed (first run, or -Prebuild) -------------------------
if ($Prebuild -or -not (Test-Path $android) -or -not (Test-Path $marker) -or ((Get-Content $marker -Raw).Trim() -ne $Abi)) {
	Push-Location $Work
	try {
		corepack pnpm exec expo prebuild --platform android --no-install --clean
		if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }
	} finally { Pop-Location }
	# forward slashes: backslashes are escape characters in .properties files
	Set-Content -Path (Join-Path $android 'local.properties') -Value ('sdk.dir=' + $sdk.Replace('\', '/')) -Encoding ascii
	Set-Content -Path $marker -Value $Abi -Encoding ascii
}

# ---- build ------------------------------------------------------------------
Push-Location $android
try {
	.\gradlew.bat :app:assembleRelease --no-daemon --console=plain
	if ($LASTEXITCODE -ne 0) { throw "gradle build failed ($LASTEXITCODE)" }
} finally { Pop-Location }

$apk = Get-ChildItem (Join-Path $android 'app\build\outputs\apk\release') -Filter *.apk | Select-Object -First 1
$outDir = Join-Path $Work 'out'
New-Item -ItemType Directory -Force $outDir | Out-Null
$dest = Join-Path $outDir "sirenplayer-$Abi.apk"
Copy-Item $apk.FullName $dest -Force
Write-Host "APK: $dest"

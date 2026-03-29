$dir = Join-Path $PSScriptRoot "..\icons" | Resolve-Path -ErrorAction SilentlyContinue
if (-not $dir) {
  $dir = Join-Path (Split-Path $PSScriptRoot -Parent) "icons"
}
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Add-Type -AssemblyName System.Drawing
$color = [System.Drawing.Color]::FromArgb(47, 52, 55)
foreach ($s in @(16, 48, 128)) {
  $bmp = New-Object System.Drawing.Bitmap $s, $s
  for ($x = 0; $x -lt $s; $x++) {
    for ($y = 0; $y -lt $s; $y++) {
      $bmp.SetPixel($x, $y, $color)
    }
  }
  $path = Join-Path $dir "icon$s.png"
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}
Write-Output "Wrote icons to $dir"

Add-Type -AssemblyName System.Drawing

function New-IconFile {
  param(
    [int]$Size,
    [string]$Path
  )

  $bitmap = New-Object System.Drawing.Bitmap $Size, $Size
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

  $bgColor = [System.Drawing.Color]::FromArgb(15, 118, 110)
  $graphics.Clear($bgColor)

  $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $fontSize = [Math]::Max([int]($Size * 0.35), 12)
  $font = New-Object System.Drawing.Font('Segoe UI', [float]$fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $text = 'SC'
  $textSize = $graphics.MeasureString($text, $font)
  $x = ($Size - $textSize.Width) / 2
  $y = ($Size - $textSize.Height) / 2
  $graphics.DrawString($text, $font, $brush, $x, $y)

  $bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

New-Item -ItemType Directory -Force -Path public\icons | Out-Null
New-IconFile -Size 192 -Path (Join-Path $PWD 'public\icons\icon-192.png')
New-IconFile -Size 512 -Path (Join-Path $PWD 'public\icons\icon-512.png')

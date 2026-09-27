Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$exe = "E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace\DualDiff-Tauri.exe"
$p = Start-Process $exe -PassThru
Start-Sleep -Seconds 6
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
$out = "E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace\assets\tauri-ui-check.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "screenshot -> $out"
if (-not $p.HasExited) { $p.Kill(); Write-Host "closed" }

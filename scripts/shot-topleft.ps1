Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class DpiShot {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [StructLayout(LayoutKind.Sequential)]
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
[DpiShot]::SetProcessDPIAware() | Out-Null
$exe = "E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace\DualDiff-Tauri.exe"
$p = Start-Process $exe -PassThru
Start-Sleep -Seconds 7
$p.Refresh()
$h = $p.MainWindowHandle
if ($h -eq 0) { Write-Host "no window"; $p.Kill(); exit 1 }
[DpiShot]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 800
$r = New-Object DpiShot+RECT
[DpiShot]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.Right - $r.Left
$hh = $r.Bottom - $r.Top
Write-Host "window $w x $hh at $($r.Left),$($r.Top)"
$bmp = New-Object System.Drawing.Bitmap $w, $hh
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size $w, $hh))
# full
$bmp.Save("E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace\assets\_win_full.png", [System.Drawing.Imaging.ImageFormat]::Png)
# top-left zoom
$cw = [Math]::Min(700, $w)
$ch = [Math]::Min(260, $hh)
$crop = $bmp.Clone([System.Drawing.Rectangle]::new(0,0,$cw,$ch), $bmp.PixelFormat)
$big = New-Object System.Drawing.Bitmap ($cw*2), ($ch*2)
$g2 = [System.Drawing.Graphics]::FromImage($big)
$g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
$g2.DrawImage($crop, 0, 0, $cw*2, $ch*2)
$big.Save("E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace\assets\_win_topleft.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose(); $crop.Dispose(); $g2.Dispose(); $big.Dispose()
Write-Host "saved crops"
if (-not $p.HasExited) { $p.Kill(); Write-Host "closed" }

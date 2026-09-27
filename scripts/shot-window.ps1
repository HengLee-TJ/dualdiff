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
Start-Sleep -Seconds 6
$p.Refresh()
$h = $p.MainWindowHandle
if ($h -eq 0) { Write-Host "no window"; $p.Kill(); exit 1 }
[DpiShot]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 600
$r = New-Object DpiShot+RECT
[DpiShot]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.Right - $r.Left
$hh = $r.Bottom - $r.Top
Write-Host "physical window: $w x $hh at ($($r.Left),$($r.Top))"
$bmp = New-Object System.Drawing.Bitmap $w, $hh
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size $w, $hh))
$out = "E:\LearnPro\04_AIWorkFlow\27_CodeCompareWorkSpace\assets\tauri-window.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Host "saved $out"
if (-not $p.HasExited) { $p.Kill(); Write-Host "closed" }

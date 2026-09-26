@echo off
title DualDiff
setlocal
set "ROOT=%~dp0"
if exist "%ROOT%DualDiff-Portable.exe" (
  start "" "%ROOT%DualDiff-Portable.exe"
  exit /b 0
)
if exist "%ROOT%desktop\node_modules\electron\dist\electron.exe" (
  start "" "%ROOT%desktop\node_modules\electron\dist\electron.exe" "%ROOT%desktop"
  exit /b 0
)
echo Run DualDiff-Desktop.vbs or install DualDiff-Portable.exe next to this script.
pause

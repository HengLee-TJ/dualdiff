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
set "EDGE="
for %%P in ("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" "%LocalAppData%\Microsoft\Edge\Application\msedge.exe") do if exist %%P set "EDGE=%%~P"
if defined EDGE (
  start "" %EDGE% --app="file:///%ROOT%index.html:\=/%" --window-size=1440,920
  exit /b 0
)
echo DualDiff runtime not found. Use DualDiff-Portable.exe or install Edge.
pause

@echo off
title DualDiff
setlocal
set "ROOT=%~dp0"
if exist "%ROOT%DualDiff-Tauri.exe" (
  start "" "%ROOT%DualDiff-Tauri.exe"
  exit /b 0
)
if exist "%ROOT%DualDiff-Portable.exe" (
  start "" "%ROOT%DualDiff-Portable.exe"
  exit /b 0
)
if exist "%ROOT%tauri-app\src-tauri\target\release\dualdiff.exe" (
  start "" "%ROOT%tauri-app\src-tauri\target\release\dualdiff.exe"
  exit /b 0
)
echo DualDiff-Tauri.exe not found.
pause

' DualDiff silent launcher — no console flash
Option Explicit
Dim sh, fso, root, exe, devExe
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)

' 1) Portable EXE
exe = root & "\DualDiff-Portable.exe"
If fso.FileExists(exe) Then
  sh.Run """" & exe & """", 1, False
  WScript.Quit 0
End If

' 2) Dev Electron
devExe = root & "\desktop\node_modules\electron\dist\electron.exe"
If fso.FileExists(devExe) Then
  sh.Run """" & devExe & """ """ & root & "\desktop""", 1, False
  WScript.Quit 0
End If

' 3) Edge app mode (hidden cmd then exit)
Dim edge, html
edge = ""
If fso.FileExists("C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe") Then
  edge = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
ElseIf fso.FileExists("C:\Program Files\Microsoft\Edge\Application\msedge.exe") Then
  edge = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
End If
html = Replace(root & "\index.html", "\", "/")
If edge <> "" Then
  sh.Run """" & edge & """ --app=file:///" & html & " --window-size=1440,920", 1, False
  WScript.Quit 0
End If

MsgBox "DualDiff runtime not found. Please keep DualDiff-Portable.exe next to this script.", 48, "DualDiff"

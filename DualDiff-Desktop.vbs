Option Explicit
Dim sh, fso, root, exe
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
root = fso.GetParentFolderName(WScript.ScriptFullName)
exe = root & "\DualDiff-Tauri.exe"
If fso.FileExists(exe) Then
  sh.Run """" & exe & """", 1, False
  WScript.Quit 0
End If
exe = root & "\DualDiff-Portable.exe"
If fso.FileExists(exe) Then
  sh.Run """" & exe & """", 1, False
  WScript.Quit 0
End If
MsgBox "DualDiff-Tauri.exe not found.", 48, "DualDiff"

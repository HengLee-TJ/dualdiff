#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileEntry {
    pub rel: String,
    pub name: String,
    pub size: u64,
    pub path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PickedDir {
    pub root: String,
    pub name: String,
    pub files: Vec<FileEntry>,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileContent {
    pub size: u64,
    pub binary: bool,
    pub large: bool,
    pub text: Option<String>,
}

fn is_ignored(rel: &str) -> bool {
    const SKIP: &[&str] = &[
        "node_modules",
        ".git",
        ".svn",
        ".hg",
        ".idea",
        ".vscode",
        "dist",
        "build",
        "out",
        "target",
        "obj",
        "bin",
        "debug",
        "release",
        "x64",
        "x86",
        "__pycache__",
        ".next",
        ".nuxt",
        ".cache",
        "coverage",
        "vendor",
        ".DS_Store",
        "Thumbs.db",
    ];
    for seg in rel.split(['/', '\\']) {
        let s = seg.to_ascii_lowercase();
        if SKIP.contains(&s.as_str()) {
            return true;
        }
        if s.ends_with(".log")
            || s.ends_with(".tmp")
            || s.ends_with(".user")
            || s.ends_with(".pdb")
        {
            return true;
        }
    }
    false
}

fn looks_binary(buf: &[u8]) -> bool {
    let n = buf.len().min(8000);
    if n == 0 {
        return false;
    }
    let mut suspicious = 0usize;
    for &c in &buf[..n] {
        if c == 0 {
            return true;
        }
        if c < 9 || (c > 13 && c < 32) {
            suspicious += 1;
        }
    }
    suspicious * 100 / n > 15
}

fn decode_bytes(buf: &[u8]) -> String {
    // BOM
    if buf.len() >= 3 && buf[0] == 0xEF && buf[1] == 0xBB && buf[2] == 0xBF {
        return String::from_utf8_lossy(&buf[3..]).into_owned();
    }
    if buf.len() >= 2 && buf[0] == 0xFF && buf[1] == 0xFE {
        let mut u16s = Vec::new();
        let mut i = 2;
        while i + 1 < buf.len() {
            u16s.push(u16::from_le_bytes([buf[i], buf[i + 1]]));
            i += 2;
        }
        return String::from_utf16_lossy(&u16s);
    }
    if buf.len() >= 2 && buf[0] == 0xFE && buf[1] == 0xFF {
        let mut u16s = Vec::new();
        let mut i = 2;
        while i + 1 < buf.len() {
            u16s.push(u16::from_be_bytes([buf[i], buf[i + 1]]));
            i += 2;
        }
        return String::from_utf16_lossy(&u16s);
    }

    // 1) Valid UTF-8 wins outright.
    //    (Scoring across encodings is unsafe: GBK-decoding UTF-8 bytes yields
    //     even more "CJK-looking" characters and would win by count.)
    if let Ok(s) = std::str::from_utf8(buf) {
        return s.to_string();
    }

    // 2) Not valid UTF-8 → try GB18030 / GBK.
    let (cow, _, had_errors) = encoding_rs::GB18030.decode(buf);
    let gbk = cow.into_owned();

    fn bad_ratio(s: &str) -> f64 {
        if s.is_empty() {
            return 0.0;
        }
        let bad = s.matches('\u{FFFD}').count();
        bad as f64 / s.chars().count() as f64
    }

    if had_errors || bad_ratio(&gbk) > 0.02 {
        // GBK decode looks broken; fall back to lossy UTF-8
        let lossy = String::from_utf8_lossy(buf).into_owned();
        if bad_ratio(&lossy) < bad_ratio(&gbk) {
            return lossy;
        }
    }
    gbk
}

fn scan_dir(root: &Path) -> Vec<FileEntry> {
    let mut out = Vec::new();
    for entry in walkdir::WalkDir::new(root).into_iter().filter_map(|e| e.ok()) {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path().to_path_buf();
        let rel = path
            .strip_prefix(root)
            .map(|p| p.to_string_lossy().replace('\\', "/"))
            .unwrap_or_else(|_| path.to_string_lossy().to_string());
        if is_ignored(&rel) {
            continue;
        }
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            rel,
            size,
            path: path.to_string_lossy().to_string(),
        });
    }
    out.sort_by(|a, b| a.rel.cmp(&b.rel));
    out
}

#[tauri::command]
async fn pick_directory(app: tauri::AppHandle, side: Option<String>) -> Option<PickedDir> {
    let title = if side.as_deref() == Some("b") {
        "Select Project B folder"
    } else {
        "Select Project A folder"
    };
    let picked = app.dialog().file().set_title(title).blocking_pick_folder();
    let path_buf = match picked {
        Some(fp) => match fp {
            tauri_plugin_dialog::FilePath::Path(p) => p,
            _ => return None,
        },
        None => return None,
    };
    let name = path_buf
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| "Project".into());
    let files = scan_dir(&path_buf);
    Some(PickedDir {
        root: path_buf.to_string_lossy().to_string(),
        name,
        files,
    })
}

#[tauri::command]
async fn scan_directory(path: String) -> Option<PickedDir> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.is_dir() {
        return None;
    }
    let name = path_buf
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());
    let files = scan_dir(&path_buf);
    Some(PickedDir {
        root: path_buf.to_string_lossy().to_string(),
        name,
        files,
    })
}

#[tauri::command]
async fn read_files(paths: Vec<String>) -> HashMap<String, FileContent> {
    let mut out = HashMap::new();
    for p in paths {
        let path = PathBuf::from(&p);
        let meta = std::fs::metadata(&path).ok();
        let size = meta.map(|m| m.len()).unwrap_or(0);
        if size > 2 * 1024 * 1024 {
            out.insert(
                p,
                FileContent {
                    size,
                    binary: true,
                    large: true,
                    text: None,
                },
            );
            continue;
        }
        match std::fs::read(&path) {
            Ok(buf) => {
                let content = if looks_binary(&buf) {
                    FileContent {
                        size,
                        binary: true,
                        large: false,
                        text: None,
                    }
                } else {
                    FileContent {
                        size,
                        binary: false,
                        large: false,
                        text: Some(decode_bytes(&buf)),
                    }
                };
                out.insert(p, content);
            }
            Err(_) => {
                out.insert(
                    p,
                    FileContent {
                        size,
                        binary: true,
                        large: false,
                        text: None,
                    },
                );
            }
        }
    }
    out
}

#[tauri::command]
async fn save_text(app: tauri::AppHandle, default_name: String, content: String) -> Option<String> {
    let picked = app
        .dialog()
        .file()
        .set_file_name(&default_name)
        .blocking_save_file();
    let path_buf = match picked {
        Some(fp) => match fp {
            tauri_plugin_dialog::FilePath::Path(p) => p,
            _ => return None,
        },
        None => return None,
    };
    std::fs::write(&path_buf, content).ok()?;
    Some(path_buf.to_string_lossy().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    const CN: &str = "复位源检测模块实现，提供系统复位原因识别功能";

    #[test]
    fn utf8_content_stays_utf8() {
        let bytes = CN.as_bytes(); // valid UTF-8
        let out = decode_bytes(bytes);
        assert_eq!(out, CN, "valid UTF-8 must not be misdetected as GBK");
    }

    #[test]
    fn gbk_content_decodes() {
        let (gbk, _, _) = encoding_rs::GB18030.encode(CN);
        let out = decode_bytes(&gbk);
        assert_eq!(out, CN, "GBK bytes must decode back to the same text");
    }

    #[test]
    fn utf8_bom_stripped() {
        let mut bytes = vec![0xEF, 0xBB, 0xBF];
        bytes.extend_from_slice(CN.as_bytes());
        let out = decode_bytes(&bytes);
        assert_eq!(out, CN);
    }

    #[test]
    fn ascii_roundtrip() {
        let s = "#include <stdio.h>\nint main(void){return 0;}\n";
        assert_eq!(decode_bytes(s.as_bytes()), s);
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            pick_directory,
            scan_directory,
            read_files,
            save_text
        ])
        .run(tauri::generate_context!())
        .expect("error while running DualDiff");
}

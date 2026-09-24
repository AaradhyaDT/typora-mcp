import fs from "fs";
import path from "path";
import { execSync, spawn, execFileSync } from "child_process";
import { marked } from "marked";
import { getTyporaExe, getTyporaThemesDir, getTyporaBuiltinThemesDir, getTyporaBaseCss, getTyporaDraftsDir, getTyporaBackupsDir, getTyporaHistoryFile, getTyporaProfileFile, getTyporaUserConfigFile } from "./config.js";
// Helper: Hex-encoded JSON file reader
export function readHexJson(filePath) {
    try {
        if (!fs.existsSync(filePath))
            return null;
        const raw = fs.readFileSync(filePath, "utf8").trim();
        if (!raw)
            return null;
        const buf = Buffer.from(raw, "hex");
        return JSON.parse(buf.toString("utf8"));
    }
    catch (err) {
        return null;
    }
}
// Helper: Hex-encoded JSON file writer
export function writeHexJson(filePath, data) {
    const jsonStr = JSON.stringify(data);
    const hex = Buffer.from(jsonStr, "utf8").toString("hex");
    fs.writeFileSync(filePath, hex, "utf8");
}
/**
 * Inspect running Typora processes on Windows using PowerShell CIM
 */
export async function getTyporaStatus() {
    const exePath = getTyporaExe();
    const installed = fs.existsSync(exePath);
    let version;
    try {
        const pkgPath = path.join(path.dirname(exePath), "resources", "package.json");
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            version = pkg.version;
        }
    }
    catch { }
    const status = {
        installed,
        exePath,
        version,
        isRunning: false,
        processCount: 0,
        mainWindowsCount: 0,
        openFiles: [],
        processes: []
    };
    try {
        const psScript = `Get-CimInstance Win32_Process -Filter "Name = 'Typora.exe'" | Select-Object ProcessId, CommandLine | ConvertTo-Json -Compress`;
        const stdout = execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", psScript], {
            encoding: "utf8",
            timeout: 5000
        }).trim();
        if (stdout && stdout.length > 0) {
            let parsed = JSON.parse(stdout);
            if (!Array.isArray(parsed))
                parsed = [parsed];
            status.processCount = parsed.length;
            status.isRunning = parsed.length > 0;
            for (const p of parsed) {
                const cmd = (p.CommandLine || "");
                let type = "unknown";
                let activeFile;
                if (cmd.includes("--type=gpu-process")) {
                    type = "gpu";
                }
                else if (cmd.includes("--type=renderer")) {
                    type = "renderer";
                    const match = cmd.match(/--initFilePath="?([^"]+)"?/);
                    if (match && match[1]) {
                        activeFile = match[1];
                    }
                }
                else if (cmd.includes("--type=utility")) {
                    type = "utility";
                }
                else if (!cmd.includes("--type=")) {
                    type = "main";
                    status.mainWindowsCount++;
                    // Extract file argument from command line: "C:\Program Files\Typora\Typora.exe" "C:\path\to\file.md"
                    const parts = cmd.match(/"([^"]+)"|(\S+)/g);
                    if (parts && parts.length > 1) {
                        const potentialPath = parts[parts.length - 1].replace(/^"|"$/g, "");
                        if (!potentialPath.startsWith("--") && potentialPath.toLowerCase() !== exePath.toLowerCase()) {
                            activeFile = potentialPath;
                        }
                    }
                }
                if (activeFile && !status.openFiles.includes(activeFile)) {
                    status.openFiles.push(activeFile);
                }
                status.processes.push({
                    pid: p.ProcessId,
                    type,
                    activeFile,
                    commandLine: cmd.length > 200 ? cmd.slice(0, 200) + "..." : cmd
                });
            }
        }
    }
    catch (err) {
        // If command fails, check tasklist
        try {
            const tasklist = execSync(`tasklist /FI "IMAGENAME eq Typora.exe" /FO CSV /NH`, {
                encoding: "utf8"
            });
            if (tasklist.toLowerCase().includes("typora.exe")) {
                status.isRunning = true;
            }
        }
        catch { }
    }
    return status;
}
/**
 * Open a file or folder in Typora
 */
export async function openInTypora(targetPath) {
    const exePath = getTyporaExe();
    if (!fs.existsSync(exePath)) {
        throw new Error(`Typora executable not found at: ${exePath}`);
    }
    const resolved = path.resolve(targetPath);
    if (!fs.existsSync(resolved)) {
        throw new Error(`Target path does not exist: ${resolved}`);
    }
    const child = spawn(exePath, [resolved], {
        detached: true,
        stdio: "ignore"
    });
    child.unref();
    return {
        success: true,
        path: resolved,
        message: `Launched Typora with target: ${resolved}`
    };
}
/**
 * Create a new Markdown file and launch it in Typora
 */
export async function createAndOpenDocument(params) {
    const resolved = path.resolve(params.path);
    const dir = path.dirname(resolved);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let finalContent = "";
    // Add frontmatter if provided
    if (params.frontmatter && Object.keys(params.frontmatter).length > 0) {
        finalContent += "---\n";
        for (const [k, v] of Object.entries(params.frontmatter)) {
            finalContent += `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}\n`;
        }
        finalContent += "---\n\n";
    }
    // Add Title as H1 if provided
    if (params.title) {
        finalContent += `# ${params.title}\n\n`;
    }
    // Add body content
    if (params.content) {
        finalContent += params.content;
    }
    fs.writeFileSync(resolved, finalContent, "utf8");
    await openInTypora(resolved);
    return {
        success: true,
        filePath: resolved,
        message: `Created document and launched Typora: ${resolved}`
    };
}
/**
 * Close running Typora processes
 */
export async function closeTypora(pid) {
    if (pid) {
        execSync(`taskkill /F /PID ${pid}`);
        return { success: true, message: `Terminated Typora process ${pid}` };
    }
    else {
        execSync(`powershell -NoProfile -Command "Stop-Process -Name Typora -Force -ErrorAction SilentlyContinue"`);
        return { success: true, message: `Terminated all Typora processes` };
    }
}
/**
 * Get recently opened documents from history.data
 */
export function getRecentDocuments(query, limit = 20, verifyExists = true) {
    const histFile = getTyporaHistoryFile();
    const data = readHexJson(histFile);
    if (!data || !data.recentDocument) {
        return [];
    }
    let docs = data.recentDocument;
    if (query) {
        const q = query.toLowerCase();
        docs = docs.filter((d) => d.name.toLowerCase().includes(q) || d.path.toLowerCase().includes(q));
    }
    return docs.slice(0, limit).map((d) => {
        const exists = verifyExists ? fs.existsSync(d.path) : undefined;
        return {
            name: d.name,
            path: d.path,
            timestamp: d.date,
            lastOpened: new Date(d.date).toISOString(),
            relativeTime: formatRelativeTime(d.date),
            exists
        };
    });
}
/**
 * Get recently opened folders from history.data
 */
export function getRecentFolders(limit = 20) {
    const histFile = getTyporaHistoryFile();
    const data = readHexJson(histFile);
    if (!data || !data.recentFolder) {
        return [];
    }
    return data.recentFolder.slice(0, limit);
}
/**
 * List auto-saved and recovered drafts from draftsRecover
 */
export function listDrafts(query, limit = 30) {
    const draftsDir = getTyporaDraftsDir();
    if (!fs.existsSync(draftsDir))
        return [];
    const files = fs.readdirSync(draftsDir);
    let drafts = files
        .filter((f) => f.endsWith(".md"))
        .map((filename) => {
        const fullPath = path.join(draftsDir, filename);
        const stats = fs.statSync(fullPath);
        return {
            filename,
            path: fullPath,
            sizeBytes: stats.size,
            modified: stats.mtime.toISOString(),
            timestamp: stats.mtime.getTime()
        };
    })
        .sort((a, b) => b.timestamp - a.timestamp);
    if (query) {
        const q = query.toLowerCase();
        drafts = drafts.filter((d) => d.filename.toLowerCase().includes(q));
    }
    return drafts.slice(0, limit);
}
/**
 * Read the full content of an auto-saved draft
 */
export function readDraft(filename, restoreToPath) {
    const draftsDir = getTyporaDraftsDir();
    const fullPath = path.join(draftsDir, filename);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`Draft file not found: ${filename}`);
    }
    const content = fs.readFileSync(fullPath, "utf8");
    if (restoreToPath) {
        const dest = path.resolve(restoreToPath);
        const destDir = path.dirname(dest);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.writeFileSync(dest, content, "utf8");
        return {
            filename,
            content,
            restoredTo: dest
        };
    }
    return {
        filename,
        content
    };
}
/**
 * List automatic backups from backups/
 */
export function listBackups(limit = 20) {
    const backupsDir = getTyporaBackupsDir();
    if (!fs.existsSync(backupsDir))
        return [];
    const files = fs.readdirSync(backupsDir);
    return files.slice(0, limit).map((f) => {
        const fullPath = path.join(backupsDir, f);
        const stats = fs.statSync(fullPath);
        return {
            name: f,
            sizeBytes: stats.size,
            modified: stats.mtime.toISOString()
        };
    });
}
/**
 * Read Typora user preferences and configuration
 */
export function getPreferences() {
    const profileFile = getTyporaProfileFile();
    const profile = readHexJson(profileFile) || {};
    const userConfFile = getTyporaUserConfigFile();
    let userConf = {};
    if (fs.existsSync(userConfFile)) {
        try {
            userConf = JSON.parse(fs.readFileSync(userConfFile, "utf8"));
        }
        catch { }
    }
    return {
        profile,
        userConfig: userConf
    };
}
/**
 * List installed Typora themes
 */
export function listThemes() {
    const themesDir = getTyporaThemesDir();
    const builtinDir = getTyporaBuiltinThemesDir();
    const activeProfile = readHexJson(getTyporaProfileFile()) || {};
    const currentActiveTheme = activeProfile.theme || "github.css";
    const currentDarkTheme = activeProfile.darkTheme;
    const foundThemes = new Map();
    // Check builtin themes
    if (fs.existsSync(builtinDir)) {
        for (const f of fs.readdirSync(builtinDir)) {
            if (f.endsWith(".css")) {
                const themeName = path.basename(f, ".css");
                foundThemes.set(f, {
                    name: themeName,
                    file: f,
                    type: "builtin",
                    isActive: currentActiveTheme === f || currentActiveTheme === themeName,
                    isDarkActive: currentDarkTheme === f || currentDarkTheme === themeName
                });
            }
        }
    }
    // Check user themes in %APPDATA%\Typora\themes
    if (fs.existsSync(themesDir)) {
        for (const f of fs.readdirSync(themesDir)) {
            if (f.endsWith(".css")) {
                const themeName = path.basename(f, ".css");
                foundThemes.set(f, {
                    name: themeName,
                    file: f,
                    type: "user",
                    isActive: currentActiveTheme === f || currentActiveTheme === themeName,
                    isDarkActive: currentDarkTheme === f || currentDarkTheme === themeName
                });
            }
        }
    }
    return {
        activeTheme: currentActiveTheme,
        darkTheme: currentDarkTheme,
        themes: Array.from(foundThemes.values())
    };
}
/**
 * Retrieve raw CSS content for a given theme
 */
export function getThemeCss(themeName) {
    const normName = themeName.endsWith(".css") ? themeName : `${themeName}.css`;
    const userPath = path.join(getTyporaThemesDir(), normName);
    const builtinPath = path.join(getTyporaBuiltinThemesDir(), normName);
    let targetPath = "";
    if (fs.existsSync(userPath)) {
        targetPath = userPath;
    }
    else if (fs.existsSync(builtinPath)) {
        targetPath = builtinPath;
    }
    else {
        throw new Error(`Theme '${themeName}' not found in user themes or builtin themes`);
    }
    return {
        name: normName,
        css: fs.readFileSync(targetPath, "utf8"),
        path: targetPath
    };
}
/**
 * Install a custom CSS theme into Typora's theme directory
 */
export function installTheme(themeName, cssContent) {
    const safeName = themeName.replace(/[^a-zA-Z0-9_\-]/g, "").toLowerCase();
    const targetFile = path.join(getTyporaThemesDir(), `${safeName}.css`);
    const dir = path.dirname(targetFile);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetFile, cssContent, "utf8");
    return {
        success: true,
        filePath: targetFile
    };
}
/**
 * Set active theme or dark theme in profile.data
 */
export function setTheme(theme, darkTheme) {
    const profileFile = getTyporaProfileFile();
    const profile = readHexJson(profileFile) || {};
    if (theme) {
        const formatted = theme.endsWith(".css") ? theme : `${theme}.css`;
        profile.theme = formatted;
    }
    if (darkTheme) {
        const formattedDark = darkTheme.endsWith(".css") ? darkTheme : `${darkTheme}.css`;
        profile.darkTheme = formattedDark;
    }
    writeHexJson(profileFile, profile);
    return {
        success: true,
        activeTheme: profile.theme,
        darkTheme: profile.darkTheme
    };
}
/**
 * Render Markdown to standalone HTML with Typora's exact CSS styling
 */
export async function renderTyporaHtml(params) {
    let mdContent = params.content || "";
    if (params.inputPath) {
        const resolved = path.resolve(params.inputPath);
        if (!fs.existsSync(resolved)) {
            throw new Error(`Input file not found: ${resolved}`);
        }
        mdContent = fs.readFileSync(resolved, "utf8");
    }
    if (!mdContent) {
        throw new Error("No Markdown content provided to render.");
    }
    // Determine theme
    const chosenTheme = params.theme || (readHexJson(getTyporaProfileFile())?.theme || "github.css");
    let themeCss = "";
    try {
        themeCss = getThemeCss(chosenTheme).css;
    }
    catch {
        try {
            themeCss = getThemeCss("github").css;
        }
        catch { }
    }
    // Load Typora base CSS if available
    let baseCss = "";
    const baseCssPath = getTyporaBaseCss();
    if (fs.existsSync(baseCssPath)) {
        baseCss = fs.readFileSync(baseCssPath, "utf8");
    }
    // Convert markdown to HTML via marked
    const parsedBody = await marked.parse(mdContent, {
        gfm: true,
        breaks: false
    });
    const fullHtml = `<!doctype html>
<html>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width initial-scale=1'>
  <title>Typora Rendered Document</title>
  <style>
/* Typora Base CSS */
${baseCss}

/* Typora Theme CSS: ${chosenTheme} */
${themeCss}

body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
  padding: 45px;
}

@media (max-width: 767px) {
  body {
    padding: 15px;
  }
}
  </style>
</head>
<body class='typora-export'>
  <div id='write' class='entry-content'>
${parsedBody}
  </div>
</body>
</html>`;
    if (params.outputPath) {
        const outResolved = path.resolve(params.outputPath);
        const outDir = path.dirname(outResolved);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        fs.writeFileSync(outResolved, fullHtml, "utf8");
        return {
            html: fullHtml,
            outputPath: outResolved,
            themeUsed: chosenTheme,
            charCount: fullHtml.length
        };
    }
    return {
        html: fullHtml,
        themeUsed: chosenTheme,
        charCount: fullHtml.length
    };
}
function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1)
        return "just now";
    if (minutes < 60)
        return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)
        return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
//# sourceMappingURL=typora.js.map
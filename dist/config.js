import path from "path";
import os from "os";
import fs from "fs";
export const TYPORA_EXE_DEFAULT = "C:\\Program Files\\Typora\\Typora.exe";
export function getTyporaExe() {
    if (process.env.TYPORA_PATH && fs.existsSync(process.env.TYPORA_PATH)) {
        return process.env.TYPORA_PATH;
    }
    if (fs.existsSync(TYPORA_EXE_DEFAULT)) {
        return TYPORA_EXE_DEFAULT;
    }
    // Check typical 32-bit or AppData paths as fallbacks
    const p86 = "C:\\Program Files (x86)\\Typora\\Typora.exe";
    if (fs.existsSync(p86))
        return p86;
    const localExe = path.join(process.env.LOCALAPPDATA || "", "Programs", "Typora", "Typora.exe");
    if (fs.existsSync(localExe))
        return localExe;
    return TYPORA_EXE_DEFAULT;
}
export function getTyporaAppData() {
    const appData = process.env.APPDATA ||
        path.join(os.homedir(), "AppData", "Roaming");
    return path.join(appData, "Typora");
}
export function getTyporaThemesDir() {
    return path.join(getTyporaAppData(), "themes");
}
export function getTyporaBuiltinThemesDir() {
    const baseDir = path.dirname(getTyporaExe());
    return path.join(baseDir, "resources", "style", "themes");
}
export function getTyporaBaseCss() {
    const baseDir = path.dirname(getTyporaExe());
    return path.join(baseDir, "resources", "style", "base.css");
}
export function getTyporaDraftsDir() {
    return path.join(getTyporaAppData(), "draftsRecover");
}
export function getTyporaBackupsDir() {
    return path.join(getTyporaAppData(), "backups");
}
export function getTyporaHistoryFile() {
    return path.join(getTyporaAppData(), "history.data");
}
export function getTyporaProfileFile() {
    return path.join(getTyporaAppData(), "profile.data");
}
export function getTyporaUserConfigFile() {
    return path.join(getTyporaAppData(), "conf", "conf.user.json");
}
//# sourceMappingURL=config.js.map
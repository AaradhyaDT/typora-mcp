export declare function readHexJson<T = any>(filePath: string): T | null;
export declare function writeHexJson(filePath: string, data: any): void;
export interface TyporaProcessInfo {
    pid: number;
    type: "main" | "renderer" | "gpu" | "utility" | "unknown";
    activeFile?: string;
    commandLine?: string;
}
export interface TyporaStatus {
    installed: boolean;
    exePath: string;
    version?: string;
    isRunning: boolean;
    processCount: number;
    mainWindowsCount: number;
    openFiles: string[];
    processes: TyporaProcessInfo[];
}
/**
 * Inspect running Typora processes on Windows using PowerShell CIM
 */
export declare function getTyporaStatus(): Promise<TyporaStatus>;
/**
 * Open a file or folder in Typora
 */
export declare function openInTypora(targetPath: string): Promise<{
    success: boolean;
    path: string;
    message: string;
}>;
/**
 * Create a new Markdown file and launch it in Typora
 */
export declare function createAndOpenDocument(params: {
    path: string;
    content?: string;
    title?: string;
    frontmatter?: Record<string, any>;
}): Promise<{
    success: boolean;
    filePath: string;
    message: string;
}>;
/**
 * Close running Typora processes
 */
export declare function closeTypora(pid?: number): Promise<{
    success: boolean;
    message: string;
}>;
/**
 * Get recently opened documents from history.data
 */
export declare function getRecentDocuments(query?: string, limit?: number, verifyExists?: boolean): {
    name: string;
    path: string;
    timestamp: number;
    lastOpened: string;
    relativeTime: string;
    exists: boolean | undefined;
}[];
/**
 * Get recently opened folders from history.data
 */
export declare function getRecentFolders(limit?: number): (string | {
    path: string;
    date?: number;
})[];
/**
 * List auto-saved and recovered drafts from draftsRecover
 */
export declare function listDrafts(query?: string, limit?: number): {
    filename: string;
    path: string;
    sizeBytes: number;
    modified: string;
    timestamp: number;
}[];
/**
 * Read the full content of an auto-saved draft
 */
export declare function readDraft(filename: string, restoreToPath?: string): {
    filename: string;
    content: string;
    restoredTo: string;
} | {
    filename: string;
    content: string;
    restoredTo?: undefined;
};
/**
 * List automatic backups from backups/
 */
export declare function listBackups(limit?: number): {
    name: string;
    sizeBytes: number;
    modified: string;
}[];
/**
 * Read Typora user preferences and configuration
 */
export declare function getPreferences(): {
    profile: Record<string, any>;
    userConfig: Record<string, any>;
};
/**
 * List installed Typora themes
 */
export declare function listThemes(): {
    activeTheme: any;
    darkTheme: any;
    themes: {
        name: string;
        file: string;
        type: "user" | "builtin";
        isActive: boolean;
        isDarkActive: boolean;
    }[];
};
/**
 * Retrieve raw CSS content for a given theme
 */
export declare function getThemeCss(themeName: string): {
    name: string;
    css: string;
    path: string;
};
/**
 * Install a custom CSS theme into Typora's theme directory
 */
export declare function installTheme(themeName: string, cssContent: string): {
    success: boolean;
    filePath: string;
};
/**
 * Set active theme or dark theme in profile.data
 */
export declare function setTheme(theme?: string, darkTheme?: string): {
    success: boolean;
    activeTheme: string;
    darkTheme?: string;
};
/**
 * Render Markdown to standalone HTML with Typora's exact CSS styling
 */
export declare function renderTyporaHtml(params: {
    content?: string;
    inputPath?: string;
    outputPath?: string;
    theme?: string;
    embedCss?: boolean;
}): Promise<{
    html: string;
    outputPath?: string;
    themeUsed: string;
    charCount: number;
}>;
/**
 * Export Markdown directly to a styled PDF file using Typora's theme and headless browser rendering
 */
export declare function exportTyporaPdf(params: {
    inputPath?: string;
    content?: string;
    outputPath: string;
    theme?: string;
}): Promise<{
    pdfPath: string;
    sizeBytes: number;
    themeUsed: string;
}>;
//# sourceMappingURL=typora.d.ts.map
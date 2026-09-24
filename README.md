# Typora MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![MCP Version](https://img.shields.io/badge/MCP-1.6.1-blue.svg)](https://modelcontextprotocol.io)
[![Node.js](https://img.shields.io/badge/Node.js-22%2B-green.svg)](https://nodejs.org/)

**Model Context Protocol (MCP)** server providing programmatic automation, real-time status inspection, document management, auto-save draft recovery, theme customization, and pixel-perfect HTML rendering for the **Typora Markdown Editor** on Windows.

---

## Capabilities & Architecture

Typora (`C:\Program Files\Typora\Typora.exe`) is a standalone desktop Markdown editor. This MCP server bridges Typora with AI coding assistants (Google Antigravity, Claude Desktop, Cursor) via the standard Model Context Protocol over `stdio`.

### Core Features

1. **Process & Document Monitoring (`typora_status`)**:
   - Queries Windows CIM / WMI to detect running Typora processes.
   - Extracts active file paths currently being edited in open windows.
   - Reports process IDs, architecture types (`main`, `renderer`, `gpu`), and app version.

2. **Document & Workspace Launching (`typora_open`, `typora_create_document`)**:
   - Spawns Typora asynchronously with any target file or folder workspace.
   - Creates new Markdown documents with structured YAML frontmatter and H1 headers, launching them immediately in Typora.

3. **History & Recovery Engine (`typora_recent_documents`, `typora_list_drafts`, `typora_read_draft`)**:
   - Automatically decodes Typora's hex-encoded history database (`%APPDATA%\Typora\history.data`) to track recent files, last opened dates, and verify disk presence.
   - Scans Typora's auto-save crash recovery vault (`%APPDATA%\Typora\draftsRecover\`), allowing agents to inspect and restore unsaved work.
   - Inspects automatic document backups from `%APPDATA%\Typora\backups\`.

4. **Theme Customization & Management (`typora_list_themes`, `typora_get_theme_css`, `typora_install_theme`, `typora_set_theme`)**:
   - Enumerates user themes (`%APPDATA%\Typora\themes\`) and built-in application themes (`github`, `newsprint`, `night`, `pixyll`, `whitey`).
   - Retrieves stylesheet CSS.
   - Installs new custom CSS themes directly into Typora's theme directory.
   - Safely updates user preferences (`profile.data`) to switch light or dark themes.

5. **Typora-Fidelity Markdown Rendering (`typora_render_html`)**:
   - Compiles Markdown into standalone, portable HTML styled with the exact CSS theme and layout (`#write` container) used by Typora.

---

## Tool Catalog

| Tool Name | Description | Key Parameters |
|---|---|---|
| `typora_status` | Inspect live Typora processes, active open documents, and PIDs | _none_ |
| `typora_open` | Launch Typora to open a Markdown file, text file, or folder | `path` (string, required) |
| `typora_create_document` | Create new Markdown file with frontmatter/title and launch in Typora | `path`, `title`, `frontmatter`, `content` |
| `typora_recent_documents` | Get recently opened files from Typora history with timestamps | `limit`, `query`, `verify_exists` |
| `typora_recent_folders` | Get recently opened workspaces from Typora history | `limit` |
| `typora_list_drafts` | List auto-saved/recovered drafts from `draftsRecover/` | `limit`, `query` |
| `typora_read_draft` | Read full text of an auto-saved draft or restore it to path | `filename` (required), `restore_to_path` |
| `typora_list_backups` | List automatic file backups created by Typora | `limit` |
| `typora_get_preferences` | Read user profile configuration (theme, math flags, CRLF) | _none_ |
| `typora_list_themes` | List all installed and built-in Typora themes | _none_ |
| `typora_get_theme_css` | Retrieve raw CSS stylesheet content for any theme | `theme` (required) |
| `typora_install_theme` | Install custom CSS theme directly into Typora's themes folder | `name`, `css` (required) |
| `typora_set_theme` | Set active standard or dark theme in preferences | `theme`, `dark_theme` |
| `typora_render_html` | Render Markdown to standalone HTML using Typora's CSS | `input_path`, `content`, `output_path`, `theme` |
| `typora_close` | Gracefully terminate Typora processes or a specific PID | `pid` (optional) |

---

## MCP Resources

The server exposes read-only MCP resources for live system state:

- `typora://status`: Live JSON status of running Typora instances and open files.
- `typora://recent`: Array of recent documents with timestamps.
- `typora://drafts`: List of available auto-saved drafts.
- `typora://themes`: Installed themes and active theme settings.
- `typora://preferences`: Complete user preferences.

---

## Installation & Setup

### 1. Build
```powershell
cd F:\Aaradhya-Dev-Tamrakar\typora-mcp
npm install
npm run build
npm run sync-schemas
```

### 2. Antigravity Configuration (`mcp_config.json`)
Add `typora` to `C:\Users\Aaradhya\.gemini\antigravity\mcp_config.json`:
```json
{
  "mcpServers": {
    "typora": {
      "command": "node",
      "args": [
        "F:\\Aaradhya-Dev-Tamrakar\\typora-mcp\\dist\\index.js"
      ]
    }
  }
}
```

### 3. Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "typora": {
      "command": "node",
      "args": [
        "F:\\Aaradhya-Dev-Tamrakar\\typora-mcp\\dist\\index.js"
      ]
    }
  }
}
```

---

## Ecosystem Synchronization (`sync.ps1`)

In accordance with personal tool ecosystem standards, all Git operations and schema reconciliation are managed via `sync.ps1`:

```powershell
.\sync.ps1                                   # Build, sync schemas, run pre-commit secret scan, and push
.\sync.ps1 -m "feat(typora): description"    # Scoped conventional commit
.\sync.ps1 -WhatIf                           # Dry-run preview
.\sync.ps1 -PullOnly                         # Safe rebase pull
```

---

## License

MIT © Aaradhya Dev Tamrakar

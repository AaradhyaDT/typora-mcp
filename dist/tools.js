export const TOOLS = [
    {
        name: "typora_status",
        description: "Inspect the live running state of Typora on Windows (process IDs, active documents/folders being edited, memory usage, installation path, and app version).",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "typora_open",
        description: "Launch Typora to open a specific Markdown file, text document, or workspace folder.",
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Absolute or relative path to the Markdown file or workspace directory to open in Typora."
                }
            },
            required: ["path"]
        }
    },
    {
        name: "typora_create_document",
        description: "Create a new Markdown file with optional title, YAML frontmatter, and body text, and immediately open it in Typora.",
        inputSchema: {
            type: "object",
            properties: {
                path: {
                    type: "string",
                    description: "Target file path where the Markdown document will be saved."
                },
                title: {
                    type: "string",
                    description: "Optional document title (formatted as top-level H1)."
                },
                frontmatter: {
                    type: "object",
                    description: "Optional YAML frontmatter key-value pairs (e.g. tags, author, date, status)."
                },
                content: {
                    type: "string",
                    description: "Initial body Markdown text."
                }
            },
            required: ["path"]
        }
    },
    {
        name: "typora_recent_documents",
        description: "Retrieve recently opened Markdown documents from Typora's history store (history.data), including last opened timestamp, relative time, and disk verification.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of recent documents to return (default: 20)."
                },
                query: {
                    type: "string",
                    description: "Optional search query to filter recent documents by name or path."
                },
                verify_exists: {
                    type: "boolean",
                    description: "Whether to verify if each file still exists on the filesystem (default: true)."
                }
            }
        }
    },
    {
        name: "typora_recent_folders",
        description: "Retrieve recently opened workspaces and folders from Typora's history.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of recent folders to return (default: 20)."
                }
            }
        }
    },
    {
        name: "typora_list_drafts",
        description: "List auto-saved and recovered drafts from Typora's recovery vault (draftsRecover). Useful for recovering unsaved documents or examining emergency drafts.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of drafts to return (default: 30)."
                },
                query: {
                    type: "string",
                    description: "Optional keyword to filter draft filenames."
                }
            }
        }
    },
    {
        name: "typora_read_draft",
        description: "Read the full text content of an auto-saved draft from Typora's draftsRecover vault, with an option to restore it directly to a target path.",
        inputSchema: {
            type: "object",
            properties: {
                filename: {
                    type: "string",
                    description: "Filename of the draft to read (e.g. from typora_list_drafts)."
                },
                restore_to_path: {
                    type: "string",
                    description: "Optional destination file path to restore and write the draft to."
                }
            },
            required: ["filename"]
        }
    },
    {
        name: "typora_list_backups",
        description: "List automatic file backups created by Typora in its backups directory.",
        inputSchema: {
            type: "object",
            properties: {
                limit: {
                    type: "number",
                    description: "Maximum number of backups to list (default: 20)."
                }
            }
        }
    },
    {
        name: "typora_get_preferences",
        description: "Read Typora's configuration and user preferences (profile.data), including current theme, dark theme, math flags, font settings, CRLF line endings, and auto-save timer.",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "typora_list_themes",
        description: "List all installed user themes and builtin themes in Typora, indicating the currently active theme and dark theme.",
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "typora_get_theme_css",
        description: "Retrieve the raw CSS styling for an installed Typora theme (e.g. 'github', 'night', 'newsprint', 'pixyll', 'whitey').",
        inputSchema: {
            type: "object",
            properties: {
                theme: {
                    type: "string",
                    description: "Name of the theme (with or without .css extension)."
                }
            },
            required: ["theme"]
        }
    },
    {
        name: "typora_install_theme",
        description: "Install or update a custom CSS theme directly into Typora's theme directory (%APPDATA%\\Typora\\themes) so it appears in Typora's Theme menu.",
        inputSchema: {
            type: "object",
            properties: {
                name: {
                    type: "string",
                    description: "Name of the theme (e.g. 'dracula', 'catppuccin-mocha', 'nord')."
                },
                css: {
                    type: "string",
                    description: "Raw CSS stylesheet content."
                }
            },
            required: ["name", "css"]
        }
    },
    {
        name: "typora_set_theme",
        description: "Set the active standard theme or dark theme in Typora's user preferences.",
        inputSchema: {
            type: "object",
            properties: {
                theme: {
                    type: "string",
                    description: "Theme name for standard/light mode (e.g. 'github.css', 'newsprint.css')."
                },
                dark_theme: {
                    type: "string",
                    description: "Theme name for dark mode (e.g. 'night.css')."
                }
            }
        }
    },
    {
        name: "typora_render_html",
        description: "Render Markdown content or an input Markdown file into a standalone, portable HTML document styled with Typora's exact CSS themes (inlining base.css and theme styling into #write container).",
        inputSchema: {
            type: "object",
            properties: {
                input_path: {
                    type: "string",
                    description: "Path to the source Markdown file to render."
                },
                content: {
                    type: "string",
                    description: "Direct Markdown text to render (used if input_path is not specified)."
                },
                output_path: {
                    type: "string",
                    description: "Optional destination HTML file path. If omitted, the HTML string is returned directly in the response."
                },
                theme: {
                    type: "string",
                    description: "Typora theme to use for styling (e.g. 'github', 'night', 'newsprint', 'pixyll', 'whitey'). Defaults to the active Typora theme."
                }
            }
        }
    },
    {
        name: "typora_close",
        description: "Gracefully terminate running Typora processes on Windows, or kill a specific Typora window by process ID.",
        inputSchema: {
            type: "object",
            properties: {
                pid: {
                    type: "number",
                    description: "Optional specific process ID to terminate. If omitted, closes all Typora processes."
                }
            }
        }
    }
];
//# sourceMappingURL=tools.js.map
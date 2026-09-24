import {
  getTyporaStatus,
  openInTypora,
  createAndOpenDocument,
  closeTypora,
  getRecentDocuments,
  getRecentFolders,
  listDrafts,
  readDraft,
  listBackups,
  getPreferences,
  listThemes,
  getThemeCss,
  installTheme,
  setTheme,
  renderTyporaHtml,
  exportTyporaPdf
} from "./typora.js";

export async function handleToolCall(
  name: string,
  args: any
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    switch (name) {
      case "typora_status": {
        const status = await getTyporaStatus();
        return {
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }]
        };
      }

      case "typora_open": {
        if (!args?.path) {
          throw new Error("Missing required argument: 'path'");
        }
        const res = await openInTypora(args.path);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      case "typora_create_document": {
        if (!args?.path) {
          throw new Error("Missing required argument: 'path'");
        }
        const res = await createAndOpenDocument({
          path: args.path,
          content: args.content,
          title: args.title,
          frontmatter: args.frontmatter
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      case "typora_recent_documents": {
        const limit = args?.limit !== undefined ? Number(args.limit) : 20;
        const query = args?.query as string | undefined;
        const verifyExists = args?.verify_exists !== undefined ? Boolean(args.verify_exists) : true;
        const docs = getRecentDocuments(query, limit, verifyExists);
        return {
          content: [{ type: "text", text: JSON.stringify({ count: docs.length, documents: docs }, null, 2) }]
        };
      }

      case "typora_recent_folders": {
        const limit = args?.limit !== undefined ? Number(args.limit) : 20;
        const folders = getRecentFolders(limit);
        return {
          content: [{ type: "text", text: JSON.stringify({ count: folders.length, folders }, null, 2) }]
        };
      }

      case "typora_list_drafts": {
        const limit = args?.limit !== undefined ? Number(args.limit) : 30;
        const query = args?.query as string | undefined;
        const drafts = listDrafts(query, limit);
        return {
          content: [{ type: "text", text: JSON.stringify({ count: drafts.length, drafts }, null, 2) }]
        };
      }

      case "typora_read_draft": {
        if (!args?.filename) {
          throw new Error("Missing required argument: 'filename'");
        }
        const res = readDraft(args.filename, args.restore_to_path);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      case "typora_list_backups": {
        const limit = args?.limit !== undefined ? Number(args.limit) : 20;
        const backups = listBackups(limit);
        return {
          content: [{ type: "text", text: JSON.stringify({ count: backups.length, backups }, null, 2) }]
        };
      }

      case "typora_get_preferences": {
        const prefs = getPreferences();
        return {
          content: [{ type: "text", text: JSON.stringify(prefs, null, 2) }]
        };
      }

      case "typora_list_themes": {
        const themes = listThemes();
        return {
          content: [{ type: "text", text: JSON.stringify(themes, null, 2) }]
        };
      }

      case "typora_get_theme_css": {
        if (!args?.theme) {
          throw new Error("Missing required argument: 'theme'");
        }
        const cssData = getThemeCss(args.theme);
        return {
          content: [{ type: "text", text: JSON.stringify(cssData, null, 2) }]
        };
      }

      case "typora_install_theme": {
        if (!args?.name || !args?.css) {
          throw new Error("Missing required arguments: 'name' and 'css'");
        }
        const res = installTheme(args.name, args.css);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      case "typora_set_theme": {
        const res = setTheme(args?.theme, args?.dark_theme);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      case "typora_render_html": {
        const res = await renderTyporaHtml({
          content: args?.content,
          inputPath: args?.input_path,
          outputPath: args?.output_path,
          theme: args?.theme
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      case "typora_export_pdf": {
        if (!args?.output_path) {
          throw new Error("Missing required argument: 'output_path'");
        }
        const res = await exportTyporaPdf({
          content: args?.content,
          inputPath: args?.input_path,
          outputPath: args?.output_path,
          theme: args?.theme
        });
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      case "typora_close": {
        const res = await closeTypora(args?.pid);
        return {
          content: [{ type: "text", text: JSON.stringify(res, null, 2) }]
        };
      }

      default:
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown tool name: ${name}` }]
        };
    }
  } catch (error: any) {
    return {
      isError: true,
      content: [{ type: "text", text: `Typora MCP Error: ${error.message || String(error)}` }]
    };
  }
}

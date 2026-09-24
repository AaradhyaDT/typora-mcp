#!/usr/bin/env node
/**
 * Typora MCP Server Entrypoint.
 *
 * Runs over standard input/output (StdioServerTransport) for Antigravity,
 * Claude Desktop, and other Model Context Protocol clients.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { TOOLS } from "./tools.js";
import { handleToolCall } from "./handlers.js";
import { getTyporaStatus, getRecentDocuments, listDrafts, listThemes, getPreferences } from "./typora.js";
async function main() {
    const mcp = new Server({
        name: "typora-mcp",
        version: "1.0.0"
    }, {
        capabilities: {
            tools: {},
            resources: {}
        }
    });
    // List tools
    mcp.setRequestHandler(ListToolsRequestSchema, async () => {
        return { tools: TOOLS };
    });
    // Call tool
    mcp.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        return await handleToolCall(name, args);
    });
    // List resources
    mcp.setRequestHandler(ListResourcesRequestSchema, async () => {
        return {
            resources: [
                {
                    uri: "typora://status",
                    name: "Typora Running Status",
                    description: "Live process information and active documents open in Typora",
                    mimeType: "application/json"
                },
                {
                    uri: "typora://recent",
                    name: "Typora Recent Documents",
                    description: "Recently opened documents from Typora history",
                    mimeType: "application/json"
                },
                {
                    uri: "typora://drafts",
                    name: "Typora Auto-saved Drafts",
                    description: "Recoverable auto-saved drafts from Typora recovery vault",
                    mimeType: "application/json"
                },
                {
                    uri: "typora://themes",
                    name: "Typora Installed Themes",
                    description: "Installed CSS themes and active theme configuration",
                    mimeType: "application/json"
                },
                {
                    uri: "typora://preferences",
                    name: "Typora Preferences",
                    description: "User profile settings, math flags, and typography preferences",
                    mimeType: "application/json"
                }
            ]
        };
    });
    // Read resource
    mcp.setRequestHandler(ReadResourceRequestSchema, async (request) => {
        const uri = request.params.uri;
        switch (uri) {
            case "typora://status": {
                const status = await getTyporaStatus();
                return {
                    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(status, null, 2) }]
                };
            }
            case "typora://recent": {
                const recent = getRecentDocuments(undefined, 30, true);
                return {
                    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(recent, null, 2) }]
                };
            }
            case "typora://drafts": {
                const drafts = listDrafts(undefined, 30);
                return {
                    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(drafts, null, 2) }]
                };
            }
            case "typora://themes": {
                const themes = listThemes();
                return {
                    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(themes, null, 2) }]
                };
            }
            case "typora://preferences": {
                const prefs = getPreferences();
                return {
                    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(prefs, null, 2) }]
                };
            }
            default:
                throw new Error(`Resource not found: ${uri}`);
        }
    });
    const transport = new StdioServerTransport();
    await mcp.connect(transport);
    process.stderr.write("[typora-mcp] Typora MCP server running on stdio\n");
}
main().catch((err) => {
    process.stderr.write(`[typora-mcp] Fatal error: ${err}\n`);
    process.exit(1);
});
//# sourceMappingURL=index.js.map
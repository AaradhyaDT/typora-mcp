import { spawn } from "child_process";

const child = spawn("node", ["dist/index.js"], {
  stdio: ["pipe", "pipe", "inherit"]
});

let buffer = "";

function send(msg) {
  child.stdin.write(JSON.stringify(msg) + "\n");
}

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";
  for (const line of lines) {
    if (!line.trim()) continue;
    const msg = JSON.parse(line);

    if (msg.id === 1) {
      console.log("Initialized server:", msg.result?.serverInfo);
      send({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "typora_list_themes",
          arguments: {}
        }
      });
    } else if (msg.id === 2) {
      console.log("\n--- typora_list_themes ---");
      console.log(msg.result?.content?.[0]?.text);
      send({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "typora_get_preferences",
          arguments: {}
        }
      });
    } else if (msg.id === 3) {
      console.log("\n--- typora_get_preferences ---");
      const prefs = JSON.parse(msg.result?.content?.[0]?.text || "{}");
      console.log("Active theme:", prefs.profile?.theme);
      console.log("Dark theme:", prefs.profile?.darkTheme);
      console.log("Math enabled:", prefs.profile?.enable_inline_math);
      send({
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: {
          name: "typora_render_html",
          arguments: {
            content: "# Hello from Typora MCP\n\nThis is a test paragraph with **bold** text and inline math: $E = mc^2$.\n\n- Task 1\n- Task 2\n\n| Item | Value |\n| --- | --- |\n| Speed | Instant |",
            theme: "github"
          }
        }
      });
    } else if (msg.id === 4) {
      console.log("\n--- typora_render_html ---");
      const renderRes = JSON.parse(msg.result?.content?.[0]?.text || "{}");
      console.log("Theme used:", renderRes.themeUsed);
      console.log("Char count:", renderRes.charCount);
      console.log("Snippet:", renderRes.html?.slice(0, 300) + "...");
      child.kill();
      process.exit(0);
    }
  }
});

send({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" }
  }
});

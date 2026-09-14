import { spawn } from "node:child_process";
import { mkdtempSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it, expect, afterAll } from "vitest";

const cliBin = resolve(import.meta.dirname, "../../dist/cli/bin.js");
const mcpBin = resolve(import.meta.dirname, "../../dist/mcp/bin.js");
const tempDirs: string[] = [];

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

/** Runs a server entry, sends one initialize request, resolves with the reply. */
function handshake(command: string, args: string[] = []): Promise<string> {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [command, ...args], { stdio: ["pipe", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (chunk) => (out += String(chunk)));
    child.stdin.write(
      JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.0" },
        },
      }) + "\n",
    );
    setTimeout(() => {
      child.kill();
      resolvePromise(out);
    }, 3000);
  });
}

describe("MCP entry points", () => {
  it("serves MCP from the dedicated crucible-mcp bin", async () => {
    expect(await handshake(mcpBin)).toContain('"protocolVersion"');
  }, 10000);

  // `npx -y crucible-mcp` is the documented install path, and npm installs bins
  // as symlinks, so this is the shape that actually ships.
  it("serves MCP from the crucible-mcp bin through a symlink", async () => {
    const dir = mkdtempSync(join(tmpdir(), "crucible-mcpbin-"));
    tempDirs.push(dir);
    const link = join(dir, "crucible-mcp");
    symlinkSync(mcpBin, link);
    expect(await handshake(link)).toContain('"protocolVersion"');
  }, 10000);

  it("serves MCP via the crucible mcp subcommand", async () => {
    expect(await handshake(cliBin, ["mcp"])).toContain('"protocolVersion"');
  }, 10000);

  // npm installs `bin` as a symlink, so anything resolving paths from argv[1]
  // sees the link rather than the real file. This is the path `npx crucible mcp`
  // takes, and it silently served nothing when that distinction was mishandled.
  it("serves MCP via the subcommand through a symlink, as an installed bin is", async () => {
    const dir = mkdtempSync(join(tmpdir(), "crucible-bin-"));
    tempDirs.push(dir);
    const link = join(dir, "crucible");
    symlinkSync(cliBin, link);
    expect(await handshake(link, ["mcp"])).toContain('"protocolVersion"');
  }, 10000);
});

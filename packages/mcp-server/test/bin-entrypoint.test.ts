import { spawn } from "node:child_process";
import { mkdtempSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, it, expect, afterAll } from "vitest";

const entry = resolve(import.meta.dirname, "../dist/index.js");
const tempDirs: string[] = [];

afterAll(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
});

/** Sends one `initialize` request over stdio and resolves with whatever came back. */
function handshake(command: string): Promise<string> {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [command], { stdio: ["pipe", "pipe", "pipe"] });
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

describe("bin entrypoint", () => {
  it("auto-starts when run directly", async () => {
    expect(await handshake(entry)).toContain('"protocolVersion"');
  }, 10000);

  // npm installs `bin` as a symlink, so argv[1] is the link path while
  // import.meta.url is the resolved target. A main-module check that compares
  // the two without realpath silently never starts the server, which is the
  // exact path `npx canvasloop-mcp-server` takes.
  it("auto-starts when invoked through a symlink, as an installed bin is", async () => {
    const dir = mkdtempSync(join(tmpdir(), "canvasloop-bin-"));
    tempDirs.push(dir);
    const link = join(dir, "canvasloop-mcp-server");
    symlinkSync(entry, link);
    expect(await handshake(link)).toContain('"protocolVersion"');
  }, 10000);
});

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));
const revision = spawnSync("git", ["rev-parse", "--short=7", "HEAD"], { encoding: "utf8" });
const commit = revision.status === 0 ? revision.stdout.trim() : "unknown";
const builtAt = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";

export default defineConfig({
  define: {
    __FLIGHT_BUILD__: JSON.stringify({ version, commit, builtAt }),
  },
  preview: {
    headers: { "Cache-Control": "no-store" },
  },
});

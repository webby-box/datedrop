import { existsSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

process.env.GITHUB_PAGES = "1";
process.env.NEXT_PUBLIC_STATIC = "1";
process.env.NEXT_PUBLIC_BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "/datedrop";

const api = "src/app/api";
const apiBak = ".pages-api-bak";
const proxy = "src/proxy.ts";
const proxyBak = ".pages-proxy-bak.ts";

function restore() {
  if (existsSync(apiBak) && !existsSync(api)) renameSync(apiBak, api);
  if (existsSync(proxyBak) && !existsSync(proxy)) renameSync(proxyBak, proxy);
}

process.on("exit", restore);
process.on("SIGINT", () => {
  restore();
  process.exit(1);
});

if (existsSync(".next")) rmSync(".next", { recursive: true, force: true });
if (existsSync(api)) renameSync(api, apiBak);
if (existsSync(proxy)) renameSync(proxy, proxyBak);

const result = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env: process.env,
  shell: true,
});

if (result.status !== 0) {
  restore();
  process.exit(result.status || 1);
}

writeFileSync(join("out", ".nojekyll"), "");
console.log("GitHub Pages export ready in ./out");

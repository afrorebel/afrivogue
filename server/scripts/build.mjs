// Bundles the server and all its dependencies into one file, so Hostinger needs no npm install.
//   node server/scripts/build.mjs           build server/dist/server.mjs
//   node server/scripts/build.mjs --watch   rebuild and restart on change (reads .env)
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { build, context } from "esbuild";

const watch = process.argv.includes("--watch");
let child = null;

const restart = {
  name: "restart",
  setup(b) {
    b.onEnd((result) => {
      if (!watch || result.errors.length) return;
      child?.kill();
      const args = [...(existsSync(".env") ? ["--env-file=.env"] : []), "server/dist/server.mjs"];
      child = spawn(process.execPath, args, { stdio: "inherit" });
    });
  },
};

const options = {
  entryPoints: ["server/src/index.ts"],
  outfile: "server/dist/server.mjs",
  bundle: true,
  platform: "node",
  target: "node18",
  format: "esm",
  legalComments: "none",
  loader: { ".sql": "text" },
  // Some dependencies still use require(); give the ESM bundle one.
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
  logLevel: "info",
  plugins: [restart],
};

if (watch) await (await context(options)).watch();
else await build(options);

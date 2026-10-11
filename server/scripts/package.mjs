// Assembles release/afrivogue-hostinger.zip: everything Hostinger needs, nothing it doesn't.
//   server.mjs   the whole server, dependencies included (no npm install needed)
//   public/      the built website
//   seed/        AfriVogue's existing content, loaded on first start into an empty database
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const out = path.join(root, "release", "afrivogue");
const zip = path.join(root, "release", "afrivogue-hostinger.zip");

for (const required of ["dist/index.html", "server/dist/server.mjs"]) {
  if (!existsSync(required)) throw new Error(`Missing ${required}. Run "npm run build" first.`);
}

rmSync(path.join(root, "release"), { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync("server/dist/server.mjs", path.join(out, "server.mjs"));
cpSync("dist", path.join(out, "public"), { recursive: true });
cpSync("server/seed", path.join(out, "seed"), { recursive: true });
cpSync(".env.example", path.join(out, ".env.example"));
cpSync("DEPLOY-HOSTINGER.md", path.join(out, "DEPLOY-HOSTINGER.md"));

writeFileSync(
  path.join(out, "package.json"),
  JSON.stringify(
    {
      name: "afrivogue",
      private: true,
      type: "module",
      engines: { node: ">=18" },
      main: "server.mjs",
      scripts: { start: "node server.mjs", build: "echo 'Already built'" },
    },
    null,
    2,
  ) + "\n",
);

execFileSync("zip", ["-qr", zip, "."], { cwd: out });
console.log(`Created ${path.relative(root, zip)}`);

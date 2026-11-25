// Pretty-print each planned item's chunk and its local dependency chunks, one folder per item. Executes nothing:
// esbuild's transform only parses and re-prints. Run from a folder where esbuild is installed (npm i -D esbuild).
// Usage: node prep.mjs <site-dir> [plan.json]   (reads <site-dir>/assets, writes <site-dir>/pretty/<slug>/)
import { transform } from "esbuild";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";

const [, , site, planFile = `${site}/plan.json`] = process.argv;
const plan = JSON.parse(readFileSync(planFile, "utf8"));
// Site-wide chunks every item shares: not part of the item.
const SITE = /^(index-|site-|supabase|rolldown|react-|jsx-runtime|gtag|[A-Z]\w*Page-)/;
for (const p of plan) {
  const dir = `${site}/pretty/${p.slug}`;
  mkdirSync(dir, { recursive: true });
  const seen = [], stack = [p.chunks[0]];
  while (stack.length) {
    const n = stack.pop();
    if (seen.includes(n)) continue;
    seen.push(n);
    const src = readFileSync(`${site}/assets/${n}`, "utf8");
    writeFileSync(`${dir}/${n}`, (await transform(src, { loader: "js", format: "esm" })).code);
    for (const m of src.matchAll(/from\s*"\.\/([^"]+\.js)"/g)) if (!SITE.test(m[1]) && existsSync(`${site}/assets/${m[1]}`)) stack.push(m[1]);
  }
  for (const c of p.css || []) if (existsSync(`${site}/assets/${c}`)) writeFileSync(`${dir}/${c}`, readFileSync(`${site}/assets/${c}`));
  p.local = seen;
}
writeFileSync(planFile, JSON.stringify(plan, null, 1));
console.log(plan.length, "items,", plan.reduce((a, p) => a + p.local.length, 0), "files");

import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { pieces } from "../src/components/sites/onde/content.mjs";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const output=resolve(process.argv[2] ?? "Liang-Ping.html");
const paths=["/sites/onde/silk.webp",...pieces.flatMap(p=>[p.image,`/sites/onde/objects/${p.id}.webp`])];
const assets=Object.fromEntries(await Promise.all(paths.map(async path=>{
  const bytes=await readFile(resolve(root,`public${path}`));
  return [path,`data:image/${path.endsWith("jpg")?"jpeg":"webp"};base64,${bytes.toString("base64")}`];
})));
const result=await build({absWorkingDir:root,entryPoints:["scripts/offline-entry.tsx"],bundle:true,write:false,minify:true,
  outdir:"offline-bundle",platform:"browser",target:"es2022",jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'},
  external:["/sites/onde/*"],legalComments:"inline"});
const js=result.outputFiles.find(f=>f.path.endsWith(".js")).text.replace(/<\/script/gi,"<\\/script");
let css=result.outputFiles.find(f=>f.path.endsWith(".css")).text;
for(const [name,url] of Object.entries(assets))css=css.replaceAll(name,url);
await writeFile(output,`<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' fill='%23f4f4ee'/%3E%3Ctext x='32' y='43' text-anchor='middle' font-family='serif' font-size='31' fill='%23222625'%3ELP%3C/text%3E%3C/svg%3E"><title>Liang Ping | Atelier Onde</title>
<style>${css}</style></head><body><div id="edition"></div><noscript>请开启 JavaScript 查看本季作品。</noscript>
<script>globalThis.__ONDE_ASSETS__=${JSON.stringify(assets)};</script><script>${js}</script></body></html>`);
console.log(`Offline edition: ${output} (${paths.length} embedded images)`);

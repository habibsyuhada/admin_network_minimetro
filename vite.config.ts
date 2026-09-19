import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "noc-shift-offline",
      generateBundle(_, bundle) {
        const files = Object.keys(bundle).filter(
          (name) => !name.endsWith(".map"),
        );
        const hash = createHash("sha256");
        hash.update(readFileSync(new URL("./index.html", import.meta.url)));
        for (const name of [...files].sort()) {
          const asset = bundle[name];
          hash
            .update(name)
            .update(asset.type === "chunk" ? asset.code : asset.source);
        }
        for (const name of [
          "manifest.webmanifest",
          "icon-192.png",
          "icon-512.png",
          "THIRD_PARTY_NOTICES.txt",
        ])
          hash.update(
            readFileSync(new URL(`./public/${name}`, import.meta.url)),
          );
        const version = hash.digest("hex").slice(0, 12);
        const assets = [
          "./",
          "./index.html",
          "./manifest.webmanifest",
          "./icon-192.png",
          "./icon-512.png",
          "./THIRD_PARTY_NOTICES.txt",
          ...files.map((name) => "./" + name),
        ];
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: `const PREFIX='noc-shift-'+encodeURIComponent(self.registration.scope)+'-';
const CACHE=PREFIX+'${version}';
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key))))));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('./index.html',self.registration.scope))).then(cached=>cached||fetch(request)));return;}
event.respondWith(caches.open(CACHE).then(cache=>cache.match(request,{ignoreVary:true})).then(cached=>cached||fetch(request)));});`,
        });
      },
    },
  ],
  base: "./",
});

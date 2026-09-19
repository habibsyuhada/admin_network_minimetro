import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "noc-shift-offline",
      generateBundle(_, bundle) {
        const files = Object.keys(bundle).filter(
          (name) => !name.endsWith(".map"),
        );
        const version = createHash("sha256")
          .update(files.join(","))
          .digest("hex")
          .slice(0, 12);
        const assets = [
          "./",
          "./index.html",
          "./manifest.webmanifest",
          "./icon-192.png",
          "./icon-512.png",
          ...files.map((name) => "./" + name),
        ];
        this.emitFile({
          type: "asset",
          fileName: "sw.js",
          source: `const CACHE='noc-shift-${version}';
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('noc-shift-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match(new URL('./index.html',self.registration.scope)).then(response=>response||Response.error())));return;}
event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));});`,
        });
      },
    },
  ],
  base: "./",
});

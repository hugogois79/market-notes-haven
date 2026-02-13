
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

// Plugin to serve folder listings from the server filesystem
function folderBrowserPlugin(): Plugin {
  return {
    name: "folder-browser-api",
    configureServer(server) {
      server.middlewares.use("/api/browse-folders", (req, res) => {
        const url = new URL(req.url || "/", "http://localhost");
        const dirPath = url.searchParams.get("path") || "/root/Robsonway-Research";

        // Security: only allow browsing under allowed roots
        const allowedRoots = ["/root/Robsonway-Research", "/root"];
        const resolved = path.resolve(dirPath);
        const isAllowed = allowedRoots.some((root) => resolved.startsWith(root));

        if (!isAllowed) {
          res.writeHead(403, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Acesso negado a este caminho" }));
          return;
        }

        try {
          if (!fs.existsSync(resolved)) {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Pasta não encontrada" }));
            return;
          }

          const entries = fs.readdirSync(resolved, { withFileTypes: true });
          const folders = entries
            .filter((e) => e.isDirectory() && !e.name.startsWith("."))
            .map((e) => ({
              name: e.name,
              path: path.join(resolved, e.name),
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              current: resolved,
              parent: path.dirname(resolved),
              folders,
            })
          );
        } catch (err: any) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    folderBrowserPlugin(),
    react({
      jsxImportSource: "react",
    }),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Market Notes Haven',
        short_name: 'Notes Haven',
        description: 'A comprehensive market notes tracking and management application',
        theme_color: '#3B82F6',
        background_color: '#1A1D21',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        id: '/',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/icons/icon-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icons/icon-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10 MB
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/pdf.worker*.mjs'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react": path.resolve(__dirname, "node_modules/react"),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
}));


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
export default defineConfig(({ mode }) => {
  /**
   * code-server / Simple Browser: `http://127.0.0.1:8081` no *teu* browser aponta para o teu PC
   * (ecrã branco). Usa o URL Tailscale do nó onde corre o Vite (100.x ou MagicDNS), p.ex.:
   * `VITE_DEV_SERVER_ORIGIN=http://100.107.249.99:8081 npm run dev` ou `npm run dev:tailscale`
   */
  const devPub = process.env.VITE_DEV_SERVER_ORIGIN?.trim();
  let devPubUrl: URL | null = null;
  if (devPub && mode === "development") {
    try {
      devPubUrl = new URL(devPub);
    } catch {
      console.warn("[vite] VITE_DEV_SERVER_ORIGIN inválido:", devPub);
    }
  }
  const serverPublic =
    devPubUrl != null
      ? {
          origin: devPubUrl.origin,
          hmr: {
            protocol: devPubUrl.protocol === "https:" ? ("wss" as const) : ("ws" as const),
            host: devPubUrl.hostname,
            clientPort: devPubUrl.port ? parseInt(devPubUrl.port, 10) : 8081,
          },
        }
      : {};

  return {
  server: {
    host: true,
    port: 8081,
    ...serverPublic,
    proxy: {
      "/api/legal-files": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api/work-files": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 8081,
  },
  plugins: [
    folderBrowserPlugin(),
    react({
      jsxImportSource: "react",
    }),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      /** Em dev, SW desligado — evita ecrã em branco no Simple Browser / WebViews (intercepta HTML/JS). */
      devOptions: {
        enabled: false,
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
            /** Evita que o SW sirva HTML/cache em pedidos de PDF/API locais (preview Work). */
            urlPattern: ({ url }) =>
              url.pathname.startsWith("/api/work-files") ||
              url.pathname.startsWith("/api/legal-files"),
            handler: "NetworkOnly",
          },
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
};
});

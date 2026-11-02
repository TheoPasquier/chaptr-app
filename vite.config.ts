import { defineConfig } from "vite";
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// `base: "./"` → chemins relatifs : le build fonctionne tel quel sur GitHub Pages
// (user.github.io/mon-repo/), sur un domaine racine ou depuis un simple dossier servi en local.
// Le résultat va dans `docs/`, le dossier que GitHub Pages sait publier directement.
export default defineConfig({
  base: "./",
  build: { outDir: "docs", emptyOutDir: true },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Chaptr",
        short_name: "Chaptr",
        description: "Journal de lecture de mangas, 100 % local.",
        lang: "fr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#f3f3ef",
        theme_color: "#171717",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Tout le build est mis en cache : la page s'ouvre ensuite sans aucune connexion.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
      },
    }),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});

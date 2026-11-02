import { defineConfig, type Plugin } from "vite";
import path from "node:path";
import fs from "node:fs";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Build « fichier unique » : tout (JS, CSS, police, icône) est inliné dans un
 * seul chaptr.html qui s'ouvre par double-clic, sans serveur ni connexion.
 *   npm run build:single  →  dist-single/chaptr.html
 */
function inlineFavicon(): Plugin {
  return {
    name: "chaptr-inline-favicon",
    transformIndexHtml(html) {
      const svg = fs.readFileSync(path.resolve(__dirname, "public/favicon.svg"), "utf8");
      const data = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      return html
        .replace('href="./favicon.svg"', `href="${data}"`)
        .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, "");
    },
    closeBundle() {
      const out = path.resolve(__dirname, "dist-single");
      const from = path.join(out, "index.html");
      if (fs.existsSync(from)) fs.renameSync(from, path.join(out, "chaptr.html"));
    },
  };
}

export default defineConfig({
  base: "./",
  publicDir: false,
  plugins: [react(), tailwindcss(), inlineFavicon(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "virtual:pwa-register": path.resolve(__dirname, "./src/lib/no-sw.ts"),
    },
  },
  build: {
    outDir: "dist-single",
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: { entryFileNames: "chaptr.js" },
    },
  },
});

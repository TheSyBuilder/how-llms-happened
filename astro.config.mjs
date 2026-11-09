import { defineConfig } from "astro/config";
import preact from "@astrojs/preact";

export default defineConfig({
  output: "static",
  site: "https://thesybuilder.github.io",
  base: process.env.SITE_BASE || "/",
  integrations: [preact()],
  vite: {
    define: { __SITE_BASE__: JSON.stringify((process.env.SITE_BASE || "").replace(/\/$/, "")) },
    build: {
      cssMinify: "lightningcss",
    },
  },
});

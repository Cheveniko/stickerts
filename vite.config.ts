import tailwindcss from "@tailwindcss/vite";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    paraglideVitePlugin({
      project: "./project.inlang",
      outdir: "./src/lib/paraglide",
      strategy: ["cookie", "preferredLanguage", "url", "baseLocale"],
      routeStrategies: [
        { match: "/en", strategy: ["url", "cookie", "baseLocale"] },
        {
          match: "/en/:path(.*)?",
          strategy: ["url", "cookie", "baseLocale"],
        },
      ],
    }),
  ],
});

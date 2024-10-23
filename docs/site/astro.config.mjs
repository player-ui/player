import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import starlight from "@astrojs/starlight";
import rehypeMermaid from "rehype-mermaid";
import react from "@astrojs/react";
import starlightDocSearch from "@astrojs/starlight-docsearch";

export const BASE_PREFIX =
  process.env.NODE_ENV === "production" ? "DOCS_BASE_PATH" : undefined;

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    starlight({
      title: "Player",
      logo: {
        dark: "./src/assets/logo/logo-dark-large.png",
        light: "./src/assets/logo/logo-light-large.png",
        replacesTitle: true,
      },
      social: {
        github: "https://github.com/player-ui/player",
      },
      editLink: {
        baseUrl: "https://github.com/player-ui/player/edit/main/docs/site",
      },
      customCss: ["./src/styles/custom.css", "./src/tailwind.css"],
      components: {
        Sidebar: "./src/components/Sidebar.astro",
      },
      plugins: [
        starlightDocSearch({
          appId: "OX3UZKXCOH",
          apiKey: "ALGOLIA_SEARCH_API_KEY",
          indexName: "player-ui",
        }),
      ],
      sidebar: [
        {
          label: "Player",
          items: [
            {
              label: "Player",
              autogenerate: { directory: "player" },
            },
            {
              label: "Guides",
              autogenerate: { directory: "guides" },
            },
            {
              label: "Content",
              autogenerate: { directory: "content" },
            },
            {
              label: "Assets",
              autogenerate: { directory: "assets" },
            },
            {
              label: "Tools",
              autogenerate: { directory: "tools" },
            },
            {
              label: "XLR",
              autogenerate: { directory: "xlr" },
            },
          ],
        },
        {
          label: "Plugins",
          items: [
            {
              label: "Plugins",
              items: [
                {
                  label: "Plugins Overview",
                  slug: "plugins",
                },
                {
                  label: "Android/JVM Plugins",
                  autogenerate: { directory: "plugins/android" },
                },
                {
                  label: "Core Plugins",
                  autogenerate: { directory: "plugins/core" },
                },
                {
                  label: "iOS Plugins",
                  autogenerate: { directory: "plugins/iOS" },
                },
                {
                  label: "React Plugins",
                  autogenerate: { directory: "plugins/react" },
                },
                {
                  label: "Multiplatform Plugins",
                  autogenerate: { directory: "plugins/multiplatform" },
                },
              ],
            },
          ],
        },
        {
          label: "Tools",
          items: [
            {
              label: "View AST Explorer",
              link: "/tools/view-ast-explorer",
            },
            {
              label: "DSL Content Playground",
              link: "/tools/dsl-content-playground",
            },
          ],
        },
      ],
    }),
  ],
  base: BASE_PREFIX,
  markdown: {
    rehypePlugins: [[rehypeMermaid, { strategy: "img-svg", dark: true }]],
  },
});

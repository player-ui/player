import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import starlight from "@astrojs/starlight";
import rehypeMermaid from "rehype-mermaid";
import react from "@astrojs/react";
import starlightDocSearch from "@astrojs/starlight-docsearch";
import { visit } from "unist-util-visit";

export const rehypeLinks = (options) => {
  let base = options?.base;

  return (ast, file) => {
    if (typeof base !== "string") return;
    if (!base.startsWith("/")) base = "/" + base;
    if (base.length > 1 && base[base.length - 1] === "/")
      base = base.slice(0, -1);

    visit(ast, "element", function (node, index, parent) {
      if (node.tagName === "a") {
        const href = node.properties.href;
        if (
          typeof href === "string" &&
          href.startsWith("/") &&
          !href.startsWith(base)
        ) {
          node.properties.href = base + href;
        }
      }
    });
  };
};

export const BASE_PREFIX =
  process.env.NODE_ENV === "production" ? "DOCS_BASE_PATH" : undefined;

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/plugins/common-types": "/plugins/core/common-types/",
  },
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    starlight({
      title: "Player",
      favicon: "/favicon.ico",
      logo: {
        dark: "./src/assets/logo/logo-dark-large.png",
        light: "./src/assets/logo/logo-light-large.png",
        replacesTitle: true,
      },
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/player-ui/player",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/player-ui/player/edit/main/docs/site",
      },
      customCss: ["./src/styles/custom.css", "./src/tailwind.css"],
      components: {
        Sidebar: "./src/components/Sidebar.astro",
        SocialIcons: "./src/components/NavBar.astro",
      },
      plugins: [
        starlightDocSearch({
          apiKey: "ALGOLIA_SEARCH_API_KEY",
          appId: "ALGOLIA_SEARCH_APPID",
          indexName: "ALGOLIA_SEARCH_INDEX",
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
              label: "Authoring",
              autogenerate: { directory: "authoring" },
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
              label: "Capabilities",
              autogenerate: { directory: "capabilities" },
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
  vite: {
    ssr: {
      noExternal: ["@astrojs/react"],
    },
  },
  markdown: {
    rehypePlugins: [
      [rehypeMermaid, { strategy: "img-svg", dark: true }],
      [rehypeLinks, { base: BASE_PREFIX }],
    ],
  },
});

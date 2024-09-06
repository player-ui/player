import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import starlight from "@astrojs/starlight";
import rehypeMermaid from "rehype-mermaid";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      applyBaseStyles: false,
    }),
    starlight({
      title: "Player",
      social: {
        github: "https://github.com/player-ui/player",
      },
      editLink: {
        baseUrl: "https://github.com/player-ui/player/edit/main/docs/site",
      },
      customCss: ["./src/styles/custom.css", "./src/tailwind.css"],
      components: {
        Sidebar: "./src/components/Sidebar.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
      },
      plugins: [],
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
              autogenerate: { directory: "plugins" },
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
  markdown: {
    rehypePlugins: [[rehypeMermaid, { strategy: "img-svg", dark: true }]],
  },
});

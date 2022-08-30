load("@npm//next:index.bzl", "next")
load("@rules_player//javascript/next:next_build.bzl", "next_export")

package(default_visibility = ["//visibility:public"])

srcs = glob([
  "public/**/*",
  "pages/**/*",
  "styles/*",
  "components/**/*",
  "plugins/*",
  "utils/*",
  "config/*",
]) + [
  "next.config.mjs",
  "next-env.d.ts",
  "tsconfig.json"
]

data = [
  "//react/player:@player-ui/react",
  "//plugins/reference-assets/react:@player-ui/reference-assets-plugin-react",
  "@npm//typescript",
  "@npm//@types/react",
  "@npm//@types/node",
  "@npm//@chakra-ui/react",
  "@npm//@chakra-ui/skip-nav",
  "@npm//@chakra-ui/icons",
  "@npm//@docsearch/react",
  "@npm//lunr",
  "@npm//globby",
  "@npm//react-icons",
  "@npm//fs-extra",
  "@npm//@mdx-js/loader",
  "@npm//@mdx-js/react",
  "@npm//react-syntax-highlighter",
  "@npm//remark",
  "@npm//remark-html",
  "@npm//remark-smartypants",
  "@npm//rehype-slug",
  "@npm//rehype-autolink-headings",
  "@npm//remove-markdown",
  "@npm//github-slugger",
  "@npm//gray-matter",
  "@npm//nextjs-google-analytics"
]

next_export(
  name = "site",
  data = data,
  srcs = srcs,
  env = {
    "NODE_ENV": "production",
    # Need this b/c next will pull from env directly 
    # This just maps to a value we can stamp w/ later on
    "NEXT_PUBLIC_GA_MEASUREMENT_ID": "NEXT_PUBLIC_GA_MEASUREMENT_ID",
  },
)

next(
  name = "start",
  args = [
    "dev", './docs/site'
  ],
  data = data + srcs,
)
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:astro/package_json.bzl", astro_bin = "bin")

npm_link_all_packages(
    name = "node_modules",
)

srcs = glob([
    "public/**/*",
    "src/**/*",
]) + [
    "package.json",
    "tsconfig.json",
    "astro.config.mjs",
    "tailwind.config.mjs",
]

build_deps = [
    "//:typings",
    "//:node_modules/@types/stringify-object",
    "//:node_modules/@astrojs/starlight",
    "//:node_modules/@astrojs/tailwind",
    "//:node_modules/@astrojs/starlight-tailwind",
    "//:node_modules/rehype-mermaid",
    "//:node_modules/astro",
    "//:node_modules/@astrojs/react",
    "//:node_modules/react",
    "//:node_modules/react-dom",
    "//:node_modules/daisyui",
    "//:node_modules/tailwindcss",
    "//:node_modules/sharp",
    "//:node_modules/@monaco-editor/react",
    "//:node_modules/json5",
    "//:node_modules/stringify-object",
    "//:node_modules/esbuild-wasm",
    "//:node_modules/@player-tools/dsl",
    "//:node_modules/@astrojs/starlight-docsearch",
    "//:node_modules/dlv",
    "//:node_modules/unist-util-visit",
    "//:node_modules/starlight-package-managers",
    ":node_modules/@player-ui/player",
    ":node_modules/@player-ui/react",
    ":node_modules/@player-ui/reference-assets-plugin-components",
    ":node_modules/@player-ui/reference-assets-plugin-react",
]

astro_bin.astro(
    name = "site",
    srcs = srcs + build_deps,
    args = ["build"],
    chdir = package_name(),
    out_dirs = ["dist"],
    visibility = ["//visibility:public"]
)

astro_bin.astro_binary(
    name = "dev",
    args = ["dev"],
    chdir = package_name(),
    data = srcs + build_deps,
    tags = [
        "ibazel_notify_changes",
    ],
    visibility = ["//visibility:public"],
)

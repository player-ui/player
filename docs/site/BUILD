load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:astro/package_json.bzl", astro_bin = "bin")
load("@npm//:pagefind/package_json.bzl", pagefind_bin = "bin")


npm_link_all_packages(
    name = "node_modules",
)

# Generate git-dates.json from Git history
# Must run outside sandbox to access .git directory
# Note: This depends on git history, not just file contents, so we use no-cache
# to ensure dates are always fresh
genrule(
    name = "git_dates",
    srcs = ["generate-git-dates.mjs"],
    outs = ["git-dates.json"],
    cmd = """
        # Resolve workspace root from script location
        SCRIPT_PATH=$$(realpath $(location generate-git-dates.mjs))
        WS=$$(dirname $$(dirname $$(dirname $$SCRIPT_PATH)))
        
        # Run from the real workspace where .git exists
        cd "$$WS"
        BUILD_WORKSPACE_DIRECTORY="$$WS" node "$$SCRIPT_PATH"
        
        # Copy generated file to Bazel output location
        cp docs/site/git-dates.json "$@"
    """,
    local = 1,
    tags = ["no-sandbox", "no-cache"],
)

srcs = glob([
    "public/**/*",
    "src/**/*",
]) + [
    "package.json",
    "tsconfig.json",
    "astro.config.mjs",
    "tailwind.config.mjs",
    ":git_dates",
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
    "//:node_modules/astro-pagefind",
    "//:node_modules/pagefind",
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

astro_bin.astro_binary(
    name = "preview",
    args = ["preview"],
    chdir = package_name(),
    data = srcs + build_deps + [":site"],
    visibility = ["//visibility:public"],
)

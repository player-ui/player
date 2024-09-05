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
    "//:node_modules/@astrojs/starlight",
    "//:node_modules/@astrojs/tailwind",
    "//:node_modules/@astrojs/starlight-tailwind",
    "//:node_modules/astro",
    "//:node_modules/daisyui",
    "//:node_modules/tailwindcss",
    "//:node_modules/sharp",
]

astro_bin.astro(
    name = "site",
    srcs = srcs + build_deps,
    args = ["build"],
    chdir = package_name(),
    out_dirs = ["dist"],
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

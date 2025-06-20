load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/reference-assets-plugin-react",
    srcs = [
        "postcss.config.js",
        "tailwind.config.js",
    ] + glob(["src/**/*"]),
    build_deps = [
        "//:tsup_config",
        "//:typings",
        "//:node_modules/autoprefixer",
        "//:node_modules/postcss",
        "//:node_modules/tailwindcss",
        "//:node_modules/@tailwindcss/postcss",
        "//:node_modules/tailwindcss-animate",
    ],
    peer_deps = [
        ":node_modules/@player-ui/react",
        "//:node_modules/react",
        "//:node_modules/@types/react",
    ],
    test_deps = [
        ":node_modules/@player-ui/make-flow",
        "//:node_modules/@testing-library/react",
        "//:vitest_config",
    ],
    deps = [
        ":node_modules/@player-ui/asset-provider-plugin-react",
        ":node_modules/@player-ui/beacon-plugin-react",
        ":node_modules/@player-ui/partial-match-registry",
        ":node_modules/@player-ui/reference-assets-plugin",
        ":node_modules/@player-ui/async-node-plugin",
        "//:node_modules/@radix-ui/react-label",
        "//:node_modules/@radix-ui/react-separator",
        "//:node_modules/@radix-ui/react-slot",
        "//:node_modules/class-variance-authority",
        "//:node_modules/clsx",
        "//:node_modules/lucide-react",
        "//:node_modules/tailwind-merge",
    ],
)

load("@rules_player//player:defs.bzl", "js_xlr_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_xlr_pipeline(
    package_name = "@player-ui/reference-assets-plugin-react",
    ios_package_name = "PlayerUIReferenceAssets",
    android_package_name = "com.intuit.playerui.plugins:reference-assets",
    xlr_meta_data = {"kind": "reference"},
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
        "//:node_modules/@radix-ui/react-label",
        "//:node_modules/@radix-ui/react-separator",
        "//:node_modules/@radix-ui/react-slot",
        "//:node_modules/class-variance-authority",
        "//:node_modules/clsx",
        "//:node_modules/lucide-react",
        "//:node_modules/tailwind-merge",
    ],
    cli = "@player-cli/cli",
)

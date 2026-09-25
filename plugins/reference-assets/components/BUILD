load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")
load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@rules_player//player:defs.bzl", "xlr_bundle")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

xlr_bundle(
    name = "components_xlr_bundle",
    sources = [
        "//plugins/reference-assets/react:react_xlr",
    ],
    cli = "@player-cli/cli",
)

js_pipeline(
    package_name = "@player-ui/reference-assets-plugin-components",
    peer_deps = [
        "//:node_modules/react",
        "//:node_modules/@types/react",
        "//:node_modules/@player-lang/react-dsl",
        ":node_modules/@player-ui/player",
    ],
    deps = [
        ":node_modules/@player-ui/common-types-plugin",
        ":node_modules/@player-ui/reference-assets-plugin",
    ],
    test_deps = [
        "//:vitest_config",
        "//:node_modules/dlv"
    ],
    xlr_bundle_target = ":components_xlr_bundle",
    create_package_json_args = {
        "additional_exports": {
            "./dist/xlr/*": "./dist/xlr/*",
            "./xlr": "./dist/xlr/manifest.js",
        },
    },
)

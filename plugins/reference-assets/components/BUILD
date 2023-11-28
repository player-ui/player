load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

# js_pipeline(
#     package_name = "@player-ui/reference-assets-components",
#     peer_deps = [
#         "//:node_modules/react",
#         "//:node_modules/@types/react",
#         # "//:node_modules/@player-tools/dsl",
#     ],
#     deps = [
#         ":node_modules/@player-ui/reference-assets-plugin",
#     ],
# )

load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(name = "node_modules")

js_pipeline(
    package_name = "@player-ui/make-flow",
    deps = [
        ":node_modules/@player-ui/types",
    ]
)

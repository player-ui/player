load("@npm//:defs.bzl", "npm_link_all_packages")
load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("//jvm/hermes:hermesc.bzl", "hermes_compile")
load("//tools:defs.bzl", "NATIVE_BUILD_DEPS", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/player",
    build_deps = NATIVE_BUILD_DEPS,
    native_bundle = "Player",
    test_deps = [
        ":node_modules/@player-ui/make-flow",
        "//:vitest_config",
        # Used by optional alternative binding parser implementations
        "//:node_modules/parsimmon",
        "//:node_modules/@types/parsimmon",
        "//:node_modules/arr-flatten",
        "//:node_modules/ebnf",
    ],
    deps = [
        ":node_modules/@player-ui/partial-match-registry",
        ":node_modules/@player-ui/types",
        "//:node_modules/@types/dlv",
        "//:node_modules/dequal",
        "//:node_modules/dlv",
        "//:node_modules/error-polyfill",
        "//:node_modules/p-defer",
        "//:node_modules/queue-microtask",
        "//:node_modules/tapable-ts",
        "//:node_modules/timm",
        "//:node_modules/ts-nested-error",
    ],
)

genrule(
    name = "native",
    srcs = [":player_native_bundle"],
    outs = ["Player.native.js"],
    cmd = "echo $(SRCS) | tr ' ' '\\n' | grep %s$$ | xargs -I {} cp {} $(OUTS)" % "Player.native.js",
)

hermes_compile(
    name = "hbc",
    js = ":native",
    visibility = ["//visibility:public"],
)

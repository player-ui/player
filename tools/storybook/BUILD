load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/storybook",
    # other_srcs = ["register.js"],
    peer_deps = [
        "//:node_modules/@storybook/react",
        "//:node_modules/react",
        "//:node_modules/@types/react",
        ":node_modules/@player-ui/react",
        ":node_modules/@player-ui/make-flow",
    ],
    deps = [
        ":node_modules/@player-ui/beacon-plugin-react",
        ":node_modules/@player-ui/metrics-plugin-react",
        "//:node_modules/@chakra-ui/react",
        "//:node_modules/@devtools-ds/table",
        "//:node_modules/@monaco-editor/react",
        "//:node_modules/@player-tools/dsl",
        "//:node_modules/@reduxjs/toolkit",
        "//:node_modules/@storybook/addon-docs",
        "//:node_modules/@storybook/channels",
        "//:node_modules/@storybook/components",
        "//:node_modules/@storybook/core-events",
        "//:node_modules/@storybook/manager-api",
        "//:node_modules/@storybook/preview-api",
        "//:node_modules/@swc/wasm-web",
        "//:node_modules/@types/react-redux",
        "//:node_modules/@types/redux-state-sync",
        "//:node_modules/@types/uuid",
        "//:node_modules/bowser",
        "//:node_modules/clsx",
        "//:node_modules/dequal",
        "//:node_modules/esbuild-wasm",
        "//:node_modules/lz-string",
        "//:node_modules/react-redux",
        "//:node_modules/redux",
        "//:node_modules/redux-state-sync",
        "//:node_modules/storybook-dark-mode",
        "//:node_modules/ts-debounce",
        "//:node_modules/uuid",
    ],
)

load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/storybook",
    dependencies = [
      "@npm//@monaco-editor/react",
      "@npm//bowser",
      "@npm//storybook-dark-mode",
      "@npm//@devtools-ds/table",
      "@npm//lz-string",
      "@npm//@types/lz-string",
      "@npm//@chakra-ui/react",
      "@npm//monaco-editor",
      "@npm//react-redux",
      "@npm//redux",
      "@npm//dequal",
      "@npm//ts-debounce",
      "@npm//uuid",
      "@npm//@reduxjs/toolkit",
      "@npm//@swc/wasm-web",
      "@npm//@types/redux-state-sync",
      "@npm//esbuild-wasm",
      "@npm//redux-state-sync",
      "@npm//deep-equal",
      "@npm//@types/deep-equal",
      "@npm//@player-tools/dsl",
      "//plugins/metrics/react:@player-ui/metrics-plugin-react",
      "//plugins/beacon/react:@player-ui/beacon-plugin-react"
    ],

    other_srcs = ["register.js"],    

    peer_dependencies = [
      "@npm//@storybook/react",
      "@npm//@storybook/addons",
      "@npm//@storybook/addon-docs",
      "@npm//react",
      "@npm//@types/react",
      "//react/player:@player-ui/react",
      "//core/make-flow:@player-ui/make-flow"
    ]
)

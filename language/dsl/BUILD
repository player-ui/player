load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/dsl",
    dependencies = [
      "//core/types:@player-ui/types",
      "@npm//@types/mkdirp",
      "@npm//@types/signale",
      "@npm//chalk",
      "@npm//command-line-application",
      "@npm//fs-extra",
      "@npm//globby",
      "@npm//jsonc-parser",
      "@npm//mkdirp",
      "@npm//react-flatten-children",
      "@npm//react-json-reconciler",
      "@npm//react-merge-refs",
      "@npm//signale",
      "@npm//ts-node",
      "@npm//typescript",
      "@npm//tapable-ts",
      "@npm//dequal"
    ],
    peer_dependencies = [
      "@npm//react"
    ],
    test_data = [
      "@npm//@types/react"
    ],   
)

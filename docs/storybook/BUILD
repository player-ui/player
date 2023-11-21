load("@npm//@storybook/react:index.bzl", "build_storybook", "start_storybook")
load("@bazel_tools//tools/build_defs/pkg:pkg.bzl", "pkg_tar")

data = [
    "//plugins/common-types/core:@player-ui/common-types-plugin",
    "//core/make-flow:@player-ui/make-flow",
    "//plugins/reference-assets/react:@player-ui/reference-assets-plugin-react",
    "//plugins/reference-assets/mocks:@player-ui/reference-assets-plugin-mocks",
    "//plugins/pubsub/core:@player-ui/pubsub-plugin",
    "//plugins/pubsub/mocks:@player-ui/pubsub-plugin-mocks",
    "//plugins/data-change-listener/core:@player-ui/data-change-listener-plugin",
    "//plugins/computed-properties/core:@player-ui/computed-properties-plugin",
    "//plugins/reference-assets/components:@player-ui/reference-assets-components",
    "//tools/storybook:@player-ui/storybook",
    "//react/player:@player-ui/react",
    "//:tsconfig.json",
    "//:package.json",
]

# doesn't pick up CSS without calling it out explicitly
storybook_deps = [
    "@npm//@storybook/addon-docs",
    "@npm//time-fix-plugin",
    "@npm//util",
    "@npm//assert",
    "@npm//path-browserify",
    "@npm//dequal",
]

build_storybook(
    name = "storybook",
    args = [
        "--config-dir",
        "./docs/storybook/.storybook",
        "--output-dir",
        "$(@D)",
        "--loglevel",
        "verbose",
    ],
    data = glob(include = [
        "src/**/*",
        ".storybook/*",
    ]) + data + storybook_deps,
    output_dir = True,
    visibility = ["//visibility:public"],
)

start_storybook(
    name = "start",
    args = [
        "--config-dir",
        "./docs/storybook/.storybook",
        "--loglevel",
        "verbose",
    ],
    data = glob(include = [
        "src/**/*",
        ".storybook/*",
    ]) + data + storybook_deps,
    env = {
        "STORYBOOK_ENV": "DEVELOPMENT",
    },
    tags = [
        "ibazel_notify_changes",
    ],
)

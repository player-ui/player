load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:webpack-cli/package_json.bzl", webpack_bin = "bin")
load("@npm//:webpack-dev-server/package_json.bzl", webpack_dev_server_bin = "bin")

npm_link_all_packages(
    name = "node_modules",
)

srcs = glob([
    "public/**/*",
    "pages/**/*",
    "styles/*",
    "app/**/*",
    "components/**/*",
    "plugins/*",
    "utils/*",
    "config/*",
]) + [
    "package.json",
    "tsconfig.json",
    "webpack.config.ts",
]

build_deps = [
    "//:typings",
    "//:node_modules/webpack",
    "//:node_modules/ts-loader",
    "//:node_modules/ts-node",
    "//:node_modules/html-webpack-plugin",
    "//:node_modules/css-loader",
    "//:node_modules/style-loader",
    "//:node_modules/postcss-loader",
    "//:node_modules/babel-loader",
    "//:node_modules/@babel/preset-env",
    "//:node_modules/@babel/preset-react",
    "//:node_modules/copy-webpack-plugin",
    "//:node_modules/terser-webpack-plugin",
]

deps = [
    ":node_modules/@player-ui/react",
    ":node_modules/@player-ui/reference-assets-plugin-react",
    ":node_modules/@player-ui/asset-provider-plugin-react",
    "//:node_modules/typescript",
    "//:node_modules/tslib",
    "//:node_modules/@types/react",
    "//:node_modules/@types/node",
    # "//:node_modules/next",
    "//:node_modules/tailwindcss",
    "//:node_modules/tailwindcss-animate",
    "//:node_modules/postcss",
    "//:node_modules/autoprefixer",
    "//:node_modules/@docsearch/react",
    "//:node_modules/@docsearch/css",
    "//:node_modules/@radix-ui/react-label",
    "//:node_modules/@radix-ui/react-separator",
    "//:node_modules/@radix-ui/react-slot",
    "//:node_modules/class-variance-authority",
    "//:node_modules/clsx",
    "//:node_modules/@types/react-dom",
    "//:node_modules/react-router",
    "//:node_modules/react-router-dom",
    "//:node_modules/path-browserify",
    "//:node_modules/@types/path-browserify",
    "//:node_modules/lucide-react",
    "//:node_modules/tailwind-merge",
    "//:node_modules/lunr",
    "//:node_modules/@types/lunr",
    "//:node_modules/globby",
    "//:node_modules/react",
    "//:node_modules/react-dom",
    "//:node_modules/null-loader",
    "//:node_modules/@chakra-ui/react",
    "//:node_modules/@chakra-ui/skip-nav",
    "//:node_modules/@chakra-ui/icons",
    "//:node_modules/react-icons",
    "//:node_modules/@mdx-js/loader",
    "//:node_modules/@mdx-js/react",
    "//:node_modules/@types/mdx-js__react",
    "//:node_modules/react-syntax-highlighter",
    "//:node_modules/@types/react-syntax-highlighter",
    "//:node_modules/remark",
    "//:node_modules/remark-html",
    "//:node_modules/remark-smartypants",
    "//:node_modules/rehype-slug",
    "//:node_modules/rehype-autolink-headings",
    "//:node_modules/remove-markdown",
    "//:node_modules/github-slugger",
    "//:node_modules/gray-matter",
    # "//:node_modules/nextjs-google-analytics",
]

webpack_bin.webpack_cli(
    name = "site",
    srcs = srcs + deps + build_deps,
    args = [
        "build",
    ],
    chdir = "docs/site",
    env = {
        "NODE_OPTIONS": "--loader ts-node/esm",
        "NODE_ENV": "production",
    },
    out_dirs = ["dist"],
    visibility = ["//visibility:public"],
)

webpack_dev_server_bin.webpack_dev_server_binary(
    name = "start",
    args = [],
    chdir = package_name(),
    data = srcs + deps + build_deps,
    env = {
        "NODE_OPTIONS": "--loader ts-node/esm",
        "NODE_ENV": "development",
    },
    tags = [
        "ibazel_notify_changes",
    ],
    visibility = ["//visibility:public"],
)

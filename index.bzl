load("@bazel_skylib//lib:paths.bzl", "paths")
load("@rules_player//:index.bzl", "js_library_pipeline")
load("@rules_player//player/bundle:bundle.bzl", "bundle")

lint_exts = [".ts", ".js", ".jsx", ".tsx", ".json", ".snap"]

DATA = []
BUILD_DATA = []
TEST_DATA = [
    "@npm//c8",
    "//:babel.config.js",
    "@npm//@babel/preset-typescript",
    "@npm//@babel/preset-react",
    "@npm//@babel/plugin-transform-runtime",
    "@npm//@babel/preset-env",
    "@npm//@testing-library/jest-dom",
    "@npm//@testing-library/react",
    "//tools:jest-setup.js",
    "//tools:jest-coverage-mapper.js",
    "@npm//@jest/core",
    "@npm//@jest/transform",
    "@npm//@types/jest",
    "@npm//babel-jest",
    "@npm//jest-junit",
]
LINT_DATA = [
    "@npm//jest",
    "@npm//react",
    "//:package.json",
    "//:.prettierrc",
    "@npm//eslint-config-airbnb",
    "@npm//eslint-config-xo", 
    "@npm//eslint-config-xo-react",
    "@npm//eslint-plugin-jest",
    "@npm//eslint-config-prettier",
    "@npm//eslint-plugin-prettier",
    "@npm//@babel/eslint-parser",
    "@npm//eslint-plugin-jsdoc",
    "@npm//eslint-plugin-hooks",
    "@npm//eslint-plugin-jsx-a11y",
    "@npm//eslint-plugin-no-explicit-type-exports",
    "@npm//@kendallgassner/eslint-plugin-package-json",
    "@npm//eslint-plugin-react",
    "@npm//eslint-plugin-react-hooks",
]

BUNDLE_DATA = [
    "@npm//webpack",
    "@npm//webpack-cli",
    "@npm//util",
    "@npm//case-sensitive-paths-webpack-plugin",
    "@npm//duplicate-package-checker-webpack-plugin",
    "@npm//terser-webpack-plugin",
]

def expand_ts_outputs(srcs):
    outputs = []
    for src in srcs:
        relative = paths.relativize(src, "src")
        inDist = paths.join("dist", relative)
        outputs.append(paths.replace_extension(inDist, ".js"))
        outputs.append(paths.replace_extension(inDist, ".d.ts"))
    return outputs

def include_if_unique(source, searchArr):
    filtered = []
    for s in source:
        if s not in searchArr:
            filtered.append(s)
    return filtered

def _find_entry(dir, srcs):
    for s in srcs:
        if s in [dir + "/index.ts", dir + "/index.tsx"]:
            return s

def javascript_pipeline(
        name,
        library_name = "",
        root_dir = "src",
        out_dir = "dist",
        entry = None,
        dependencies = [],
        peer_dependencies = [],
        data = [],
        build_data = [],
        test_data = [],
        lint_data = [],
        other_srcs = [],
        **kwargs
        ):
    #Derive target specific sources
    srcs = native.glob([paths.join(root_dir, "**/*"), "README.md"]) + other_srcs

    resolved_entry = entry if entry else _find_entry(root_dir, srcs)

    js_library_pipeline(
        name = name,
        srcs = srcs,
        entry = resolved_entry,
        dependencies = dependencies + [
            "@npm//@babel/runtime"
        ],
        peer_dependencies = peer_dependencies,
        typings = ["//:typings"],
        data = DATA + data,
        test_data = include_if_unique(TEST_DATA + test_data, DATA + data),
        build_data = include_if_unique(BUILD_DATA + build_data, DATA + data),
        lint_data = include_if_unique(LINT_DATA + lint_data, DATA + data + TEST_DATA + test_data),
        out_dir = out_dir,
        create_package_json_opts = {
            "base_package_json": "//tools:pkg_json_template",
        },
        **kwargs
    )

    if (library_name):
        bundle(
            name = "%s_Bundles" % library_name,
            dist = [":%s-package_json" % name],
            deps = dependencies + peer_dependencies + build_data + BUNDLE_DATA + [
                ":%s-js_build" % name,
                "//:webpack.config.js"
            ],
            env = {
                "ROOT_FILE_NAME": resolved_entry,
                "LIBRARY_NAME": library_name
            },
            visibility = ["//visibility:public"],
            bundle_name = name.split('/')[1]
        )

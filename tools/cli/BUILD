load("@rules_player//javascript:js_library_pipeline.bzl", "PLACEHOLDER_VERSION")
load("@rules_player//javascript/package_json:package_json.bzl", "create_package_json")
load("@rules_player//javascript:utils.bzl", "filter_empty", "without_tests", "remove_duplicates", "include_exts")
load("@build_bazel_rules_nodejs//:index.bzl", "js_library", "pkg_npm")
load("@npm//jest-cli:index.bzl", "jest_test")
load("@npm//eslint:index.bzl", "eslint_test")
load("//:index.bzl", "expand_ts_outputs", "TEST_DATA", "LINT_DATA", "lint_exts")
load("@npm//oclif:index.bzl", "oclif")
load("@npm//typescript:index.bzl", "tsc")

BUILD_DATA = [
    "@npm//@babel/core",
    "@npm//@babel/preset-env",
    "@npm//@babel/preset-react",
    "@npm//@babel/preset-typescript",
    "@npm//@babel/plugin-transform-react-jsx-source",
    "@npm//@babel/register",
    "@npm//@types/babel__register",
    "@npm//@oclif/core",
    "@npm//chalk",
    "@npm//cosmiconfig",
    "@npm//cross-fetch",
    "@npm//elegant-spinner",
    "@npm//figures",
    "@npm//globby",
    "@npm//log-symbols",
    "@npm//log-update",
    "@npm//mkdirp",
    "@npm//vscode-languageserver-textdocument",
    "@npm//vscode-languageserver-types",
    "//language/dsl:@player-ui/dsl"
] 

SRCS = glob(include = ["src/**/*"], exclude=["**/__tests__/**", "**/*.test.*"])
ALL_SRCS = glob(include = ["src/**/*"])

tsc(
    name = "cli-build",
    outs = expand_ts_outputs(SRCS),
    args = [
        "-p",
        "$(execpath tsconfig.json)",
        "--outDir",
        "$(RULEDIR)/dist",
    ],
    data = SRCS + [
        "tsconfig.json",
        "//:tsconfig.json",
        "//:typings"
    ] + BUILD_DATA
)

create_package_json(
    name = "cli-package_json",
    package_name = "@player-ui/cli",
    entry = "./src/index.ts",
    out_dir = "dist",
    registry = "https://registry.npmjs.org",
    placeholder_version = PLACEHOLDER_VERSION,
    dependencies = BUILD_DATA,
    peer_dependencies = None,
    root_package_json = "//:package.json",
    base_package_json = "package.json",
)

oclif(
    name="cli-manifest",
    chdir = "$(RULEDIR)",
    args=["manifest"],
    data = [
        ":cli-package_json",
        ":cli-build"
    ] + BUILD_DATA,
    outs = ["oclif.manifest.json"]
)

eslint_test(
    name = "player-cli-lint",
    data = remove_duplicates(filter_empty(["//:.eslintrc.js"] + BUILD_DATA + LINT_DATA + TEST_DATA + ALL_SRCS)),
    args = [
        "--ext",
        ",".join(lint_exts),
    ] + ["$(execpath %s)" % (f) for f in include_exts(ALL_SRCS, lint_exts)],
)

jest_test(
    name = "player-cli-unit",
    env = {
        "JEST_JUNIT_OUTPUT_FILE": "$XML_OUTPUT_FILE",
        # Unset the coverage_dir so the default rules don't try to gather coverage
        "COVERAGE_DIR": "",
    },
    args = [
        "--no-cache",
        "--ci",
        "--colors",
    ],
    data = remove_duplicates(filter_empty(["//:jest.config.js", "package.json"] + BUILD_DATA + TEST_DATA + ALL_SRCS)),
)

pkg_npm(
    name = "cli-publish",
    deps = [":cli-build", ":cli-manifest", ":cli-package_json", ":README.md", "bin/run"],
    substitutions = {
        "__VERSION__": "{STABLE_VERSION}",
        "0.0.0-PLACEHOLDER": "{STABLE_VERSION}",
        "__GIT_COMMIT__": "{STABLE_GIT_COMMIT}",
    },
    validate = False,
)

load("@rules_player//javascript:js_library_pipeline.bzl", "PLACEHOLDER_VERSION")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_test", "js_library")
load("@rules_rust//rust:defs.bzl", "rust_binary", "rust_shared_library")
load("@rules_rust//wasm_bindgen:wasm_bindgen.bzl", "rust_wasm_bindgen")
load("@crate_index//:defs.bzl", "all_crate_deps", "aliases")
load("@rules_player//javascript/package_json:package_json.bzl", "create_package_json")


package(default_visibility = ["//visibility:public"])

BUILD_DATA = []

rust_shared_library(
    name = "check-path-rs-lib",
    srcs = glob(["src/**/*.rs", "src/*.rs"]),
    aliases = aliases(),
    edition = "2021",
    deps = all_crate_deps(normal = True),
    proc_macro_deps = all_crate_deps(proc_macro = True),
)


rust_wasm_bindgen(
    name = "index",
    target = "web",
    wasm_file = ":check-path-rs-lib",
)

create_package_json(
    name = "check-path-rs-package_json",
    package_name = "@player-ui/check-path-plugin-rs",
    out_dir = ".",
    registry = "https://registry.npmjs.org",
    placeholder_version = PLACEHOLDER_VERSION,
    dependencies = BUILD_DATA,
    peer_dependencies = None,
    root_package_json = "//:package.json",
)

js_library(
    visibility = ["//visibility:public"],
    name = "@player-ui/check-path-plugin-rs",
    deps = [":index", ":check-path-rs-package_json"],
)

# TODO:
#publish_npm_package

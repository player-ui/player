load("@rules_player//javascript:js_library_pipeline.bzl", "PLACEHOLDER_VERSION")
load("@build_bazel_rules_nodejs//:index.bzl", "js_library", "pkg_npm")
load("@rules_rust//rust:defs.bzl", "rust_shared_library", "rust_test")
load("@rules_rust//wasm_bindgen:wasm_bindgen.bzl", "rust_wasm_bindgen")
load("@crate_index//:defs.bzl", "aliases", "all_crate_deps")
load("@rules_player//javascript/package_json:package_json.bzl", "create_package_json")

package(default_visibility = ["//visibility:public"])

BUILD_DATA = []

rust_shared_library(
    name = "check-path-rs-lib",
    srcs = glob([
        "src/**/*.rs",
        "src/*.rs",
    ]),
    aliases = aliases(),
    edition = "2021",
    proc_macro_deps = all_crate_deps(proc_macro = True),
    deps = all_crate_deps(normal = True),
)

rust_wasm_bindgen(
    name = "index",
    target = "nodejs",
    wasm_file = ":check-path-rs-lib",
)

rust_test(
    name = "check-path-rs-tests",
    srcs = ["tests/wasm.rs"],
    edition = "2021",
    deps = all_crate_deps(
        normal_dev = True,
    ),
)

create_package_json(
    name = "check-path-rs-package_json",
    package_name = "@player-ui/check-path-plugin-wasm",
    base_package_json = "package.json",
    dependencies = BUILD_DATA,
    out_dir = ".",
    peer_dependencies = None,
    placeholder_version = PLACEHOLDER_VERSION,
    registry = "https://registry.npmjs.org",
    root_package_json = "//:package.json",
)

js_library(
    name = "@player-ui/check-path-plugin-wasm",
    package_name = "@player-ui/check-path-plugin-wasm",
    visibility = ["//visibility:public"],
    deps = [
        ":check-path-rs-lib",
        ":check-path-rs-package_json",
        ":index",
    ],
)

pkg_npm(
    name = "check-path-rs-publish",
    substitutions = {
        "__VERSION__": "{STABLE_VERSION}",
        "0.0.0-PLACEHOLDER": "{STABLE_VERSION}",
        "__GIT_COMMIT__": "{STABLE_GIT_COMMIT}",
    },
    validate = False,
    deps = [
        ":check-path-rs-lib",
        ":check-path-rs-package_json",
        ":index",
    ],
)

load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_test")
load("@rules_rust//rust:defs.bzl", "rust_binary", "rust_shared_library")
load("@rules_rust//wasm_bindgen:wasm_bindgen.bzl", "rust_wasm_bindgen")
load("@crate_index//:defs.bzl", "all_crate_deps", "aliases")


package(default_visibility = ["//visibility:public"])

rust_shared_library(
    name = "check-path-plugin-lib",
    srcs = glob(["src/**/*.rs", "src/*.rs"]),
    aliases = aliases(),
    edition = "2018",
    deps = all_crate_deps(normal = True),
    proc_macro_deps = all_crate_deps(proc_macro = True),
)


rust_wasm_bindgen(
    name = "check-path-plugin-web-wasm",
    target = "web",
    wasm_file = ":check-path-plugin-lib",
)

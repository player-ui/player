load("//jvm/dependencies:versions.bzl", "versions")

maven = []

main_exports = [
    "//jvm/core",
]

main_deps = main_exports

main_resources = [
    "//plugins/check-path/core:CheckPathPlugin_Bundles",
]

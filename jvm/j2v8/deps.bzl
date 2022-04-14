load("//jvm/dependencies:versions.bzl", "versions")

maven = []

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    "//jvm/j2v8/libs:j2v8_empty"
]

main_resources = [
    "//core/player:Player_Bundles"
]

test_deps = [
    "//jvm:kotlin_serialization",
]

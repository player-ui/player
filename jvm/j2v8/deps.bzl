load("//jvm/dependencies:versions.bzl", "versions")

maven = []

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",

    # TODO: Ensure all of these are _just_ compileOnly deps
    "//jvm/j2v8/libs:j2v8_empty",
    "//jvm/j2v8/libs:j2v8_debugger_no_op",
]

main_resources = [
    "//core/player:Player_Bundles",
]

test_deps = [
    "//jvm:kotlin_serialization",
]

load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven_main = []

maven = maven_main + [
    "com.github.AlexTrotsenko:j2v8-debugger:%s" % versions.j2v8.debugger,
]

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + parse_coordinates(maven_main) + [
    "//jvm:kotlin_serialization",
    "//jvm/j2v8/libs:j2v8_empty_compile_only",
    "//jvm/j2v8/libs:j2v8_debugger_compile_only",
]

# TODO: These should probably just be dependencies of headless
main_resources = [
    "//core/player:Player_Bundles",
]

test_deps = [
    "//jvm:kotlin_serialization",
]

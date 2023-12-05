load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven = [
    "com.github.AlexTrotsenko:j2v8-debugger:%s" % versions.j2v8.debugger,
]

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + parse_coordinates(maven) + [
    "//jvm:kotlin_serialization",

    # TODO: Ensure all of these are _just_ compileOnly deps
    "//jvm/j2v8/libs:j2v8_empty",
]

main_resources = [
    "//core/player:Player_Bundles",
]

test_deps = [
    "//jvm:kotlin_serialization",
]

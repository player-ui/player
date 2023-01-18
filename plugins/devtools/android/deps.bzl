load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven = [
    "com.facebook.flipper:flipper:%s" % versions.flipper,
]

main_exports = parse_coordinates(maven) + [
    "//plugins/devtools/jvm:devtools",
    "//android/player",
]

main_deps = main_exports

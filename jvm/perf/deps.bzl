load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")
load("//jvm/dependencies:versions.bzl", "versions")

maven = [
    "org.openjdk.jmh:jmh-core:%s" % versions.jmh,
    "org.openjdk.jmh:jmh-generator-annprocess:%s" % versions.jmh,
]

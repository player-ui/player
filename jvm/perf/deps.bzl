load("@rules_player//maven:defs.bzl", "parse_coordinates")
load("//jvm/dependencies:versions.bzl", "versions")

maven = [
    "org.openjdk.jmh:jmh-core:%s" % versions.jmh,
    "org.openjdk.jmh:jmh-generator-annprocess:%s" % versions.jmh,
]

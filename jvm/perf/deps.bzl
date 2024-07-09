load("//jvm/dependencies:versions.bzl", "versions")

maven = [
    "org.openjdk.jmh:jmh-core:%s" % versions.jmh,
    "org.openjdk.jmh:jmh-generator-annprocess:%s" % versions.jmh,
]

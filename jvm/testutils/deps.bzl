load("//jvm/dependencies:versions.bzl", "versions")

maven = [
    "org.junit.jupiter:junit-jupiter-api:%s" % versions.testing.jupiter,
]

main_exports = [
    "@maven//:org_junit_jupiter_junit_jupiter_api",
    "//jvm/core",
    "//jvm/utils",
    "//jvm/j2v8:j2v8-all",
    "//jvm/graaljs",
    "//jvm/hermes",
    "//plugins/common-types/jvm:common-types",
    "//plugins/reference-assets/jvm:reference-assets",
    "//tools/mocks:jar",
]

main_deps = main_exports

main_resources = [
]

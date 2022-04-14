load("//jvm/dependencies:versions.bzl", "versions")

maven = [
    "org.slf4j:slf4j-api:%s" % versions.logging.slf4j,
    "ch.qos.logback:logback-classic:%s" % versions.logging.logback,
]

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "@maven//:org_slf4j_slf4j_api",
]

test_deps = [
    "@maven//:ch_qos_logback_logback_classic",
]

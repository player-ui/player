load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven = [
    "org.jetbrains.kotlinx:kotlinx-coroutines-android:%s" % versions.kotlin.coroutines,

    # TODO: Potentially externalize versions
    "androidx.appcompat:appcompat:1.2.0",
    "androidx.core:core-ktx:1.3.2",
    "androidx.constraintlayout:constraintlayout:2.0.4",
    "androidx.navigation:navigation-fragment-ktx:2.3.3",
    "androidx.navigation:navigation-ui-ktx:2.3.3",
    "androidx.transition:transition:1.4.1",
]

main_exports = [
    "//jvm/j2v8:j2v8-android"
]

main_deps = main_exports + parse_coordinates(maven) + [
    # JVM plugin deps
    "//plugins/beacon/jvm:beacon",
    "//plugins/pubsub/jvm:pubsub",
    "//plugins/coroutines/jvm:coroutines",
]

main_resources = [
    # TS core deps
    "//plugins/partial-match-fingerprint/core:PartialMatchFingerprintPlugin_Bundles",
    "//core/partial-match-registry:Registry_Bundles",
]

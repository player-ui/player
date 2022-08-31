load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven = [
    # UI helpers
    "androidx.core:core-ktx:%s" % versions.androidx.core,
    "androidx.appcompat:appcompat:%s" % versions.androidx.appcompat,
    "androidx.transition:transition:%s" % versions.androidx.transition,

    # Lifecycle
    "androidx.lifecycle:lifecycle-runtime-ktx:%s" % versions.androidx.lifecycle,
    "androidx.lifecycle:lifecycle-viewmodel-ktx:%s" % versions.androidx.lifecycle,

    # Default fallback
    "androidx.constraintlayout:constraintlayout:%s" % versions.androidx.constraintlayout,
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

test_deps = [
    "@grab_bazel_common//tools/test:mockable-android-jar",
    "@maven//:io_mockk_mockk",
    "//jvm/testutils",
]

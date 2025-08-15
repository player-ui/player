# TODO: Delete file
load("//jvm/dependencies:versions.bzl", "versions")

maven = [
    "org.jetbrains.kotlin:kotlin-reflect:%s" % "1.7.10",
    "org.jetbrains.kotlinx:kotlinx-coroutines-core:%s" % versions.kotlin.coroutines,
    "org.jetbrains.kotlinx:kotlinx-serialization-json:%s" % versions.kotlin.serialization,
    "com.intuit.hooks:hooks:%s" % versions.hooks,

    # Testing
    "io.mockk:mockk:%s" % versions.testing.mockk,
    "org.amshove.kluent:kluent:%s" % versions.testing.kluent,
    "org.jetbrains.kotlinx:kotlinx-coroutines-test:%s" % versions.kotlin.coroutines,
]

main_deps = [
    #    "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_core",
    "@maven//:org_jetbrains_kotlinx_kotlinx_serialization_json",
    "@maven//:com_intuit_hooks_hooks",
]

test_deps = [
    "@maven//:io_mockk_mockk",
    "@maven//:org_amshove_kluent_kluent",
    "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_test",
    "//jvm/testutils",
    # We don't publish this, so we need to specify it manually as a common test dep (can remove once we publish host and include in testutils)
    # "//jvm/hermes:hermes-host",
]

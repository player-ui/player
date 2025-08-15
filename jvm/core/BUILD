load("@rules_jvm_external//:defs.bzl", "artifact")
load("//jvm:defs.bzl", "kt_player_module")

# Main dependencies
main_exports = [
    "//jvm:kotlin_serialization",
    artifact("com.intuit.hooks:hooks"),
    artifact("org.jetbrains.kotlinx:kotlinx-coroutines-core"),
    artifact("org.jetbrains.kotlinx:kotlinx-serialization-json"),
]
main_deps = main_exports + [
    artifact("org.jetbrains.kotlin:kotlin-reflect"),
]

# Test dependencies
test_deps = [
    "//jvm/testutils",
    # "//plugins/reference-assets/jvm:reference-assets",
    # "//plugins/beacon/jvm:beacon",
    artifact("io.mockk:mockk"),
]

# TODO: Sources jar for src/main/kotlin includes main/kotlin
kt_player_module(
    name = "core",
    main_deps = main_deps,
    main_exports = main_exports,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.core",
)

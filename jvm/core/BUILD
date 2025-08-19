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
    # TODO: Try pulling from @rules_kotlin -- might upgrade Kotlin :( should be kept in sync in the future
    # "@rules_kotlin//kotlin/compiler:kotlin-reflect"
    artifact("org.jetbrains.kotlin:kotlin-reflect"),
]

# Test dependencies
test_deps = [
    "//jvm/testutils",
    "//plugins/beacon/jvm",
    "//plugins/common-types/jvm",
    "//plugins/reference-assets/jvm",
    artifact("io.mockk:mockk"),
    artifact("org.amshove.kluent:kluent"),
]

# TODO: Sources jar for src/main/kotlin includes main/kotlin
kt_player_module(
    # TODO: Maybe rename to player
    name = "core",
    main_deps = main_deps,
    main_exports = main_exports,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.core",
)

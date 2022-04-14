load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven = [
    "org.jetbrains.kotlinx:kotlinx-coroutines-android:%s" % versions.kotlin.coroutines,

    "androidx.appcompat:appcompat:1.2.0",
    "androidx.core:core-ktx:1.3.2",
    "androidx.constraintlayout:constraintlayout:2.0.4",
]

main_exports = [
    "//android/player",
]

main_deps = main_exports + parse_coordinates(maven) + [
    "//jvm:kotlin_serialization",
    "//plugins/reference-assets/jvm:reference-assets",
    "//plugins/pending-transaction/jvm:pending-transaction",
]

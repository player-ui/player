load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")
load("//plugins/reference-assets/android/src/androidTest/java/com/intuit/playerui/android/reference/assets/test:deps.bzl", maven_test = "maven")

maven_main = [
        "androidx.compose.ui:ui:%s" % versions.androidx.compose,
        "androidx.compose.ui:ui-tooling:%s" % versions.androidx.compose,
        "androidx.compose.runtime:runtime:%s" % versions.androidx.compose,
]

main_exports = [
    "//android/player",
]

main_deps = main_exports + parse_coordinates(maven_main) + [
    "//jvm:kotlin_serialization",
    "//plugins/reference-assets/jvm:reference-assets",
    "//plugins/pending-transaction/jvm:pending-transaction",
]

maven = maven_main + maven_test

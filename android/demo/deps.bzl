load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven = [
    "androidx.appcompat:appcompat:1.2.0",
    "androidx.core:core-ktx:1.3.2",
    "androidx.constraintlayout:constraintlayout:2.0.4",
    "androidx.navigation:navigation-fragment-ktx:2.3.3",
    "androidx.navigation:navigation-ui-ktx:2.3.3",
    "androidx.navigation:navigation-fragment:2.3.3",
    "androidx.navigation:navigation-ui:2.3.3",
    "androidx.navigation:navigation-runtime:2.3.3",
    "com.afollestad.material-dialogs:core:3.3.0",
    "com.squareup.leakcanary:leakcanary-android:2.2",
]

main_deps = parse_coordinates(maven) + [
    "//android/player",
    "//plugins/reference-assets/android:assets",
    "//jvm/utils",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//plugins/reference-assets/mocks:jar",
]

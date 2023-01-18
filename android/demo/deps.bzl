load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven_main = [
    "androidx.navigation:navigation-runtime:%s" % versions.androidx.navigation,
    "androidx.navigation:navigation-ui-ktx:%s" % versions.androidx.navigation,
    "androidx.navigation:navigation-fragment-ktx:%s" % versions.androidx.navigation,
    "com.afollestad.material-dialogs:core:%s" % versions.material_dialogs,
    "com.google.android.material:material:%s" % versions.material,
    #"com.squareup.leakcanary:leakcanary-android:2.2",
    "com.facebook.flipper:flipper:%s" % versions.flipper,
]

maven_test = [
    "androidx.test.espresso:espresso-intents:%s" % versions.androidx.test.espresso,
    "androidx.test.ext:junit-ktx:%s" % versions.androidx.test.junit,
    "com.applitools:eyes-android-espresso:%s" % versions.testing.applitools,
]

maven = maven_main + maven_test

main_deps = parse_coordinates(maven_main) + [
    "//jvm/utils",
    "//plugins/reference-assets/android:assets",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//plugins/reference-assets/mocks:jar",
    "//plugins/devtools/android:devtools-android",
]

test_deps = parse_coordinates(maven_test) + [
    "//jvm/utils",
    "@androidx_eyes_components//aar",
]

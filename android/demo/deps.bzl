load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")

maven_main = [
    "androidx.navigation:navigation-runtime:%s" % versions.androidx.navigation,
    "androidx.navigation:navigation-ui-ktx:%s" % versions.androidx.navigation,
    "androidx.navigation:navigation-fragment-ktx:%s" % versions.androidx.navigation,
    "androidx.lifecycle:lifecycle-viewmodel-ktx:%s" % versions.androidx.lifecycle,
    "androidx.lifecycle:lifecycle-runtime-ktx:%s" % versions.androidx.lifecycle,
    "com.afollestad.material-dialogs:core:%s" % versions.material_dialogs,
    "com.google.android.material:material:%s" % versions.material,
    #"com.squareup.leakcanary:leakcanary-android:2.2",
    "com.facebook.stetho:stetho:%s" % versions.facebook.stetho,
    "com.github.AlexTrotsenko:j2v8-debugger:%s" % versions.j2v8.debugger,
    "androidx.compose.ui:ui:%s" % versions.androidx.compose,
    "androidx.compose.ui:ui-tooling:%s" % versions.androidx.compose,
    "androidx.compose.runtime:runtime:%s" % versions.androidx.compose,
]

maven_test = [
    "androidx.test.espresso:espresso-intents:%s" % versions.androidx.test.espresso,
    "androidx.test.ext:junit-ktx:%s" % versions.androidx.test.junit,
]

maven = maven_main + maven_test

main_deps = parse_coordinates(maven_main) + [
    "//jvm/utils",
    "//plugins/reference-assets/android:assets",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//plugins/mocks:jar",
]

test_deps = parse_coordinates(maven_test) + [
    "//jvm/utils",
]

load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//maven:parse_coordinates.bzl", "parse_coordinates")
load("@rules_jvm_external//:specs.bzl", _maven = "maven")

maven_main = [
        "androidx.appcompat:appcompat:1.2.0",
        "androidx.core:core-ktx:1.3.2",
        "androidx.constraintlayout:constraintlayout:2.0.4",
#        "androidx.navigation:navigation-fragment-ktx:2.3.3",
#        "androidx.navigation:navigation-ui-ktx:2.3.3",
#        "androidx.navigation:navigation-fragment:2.3.3",
#        "androidx.navigation:navigation-ui:2.3.3",
#        "androidx.navigation:navigation-runtime:2.3.3",
        "com.afollestad.material-dialogs:core:3.3.0",

    "androidx.lifecycle:lifecycle-runtime-ktx:%s" % versions.androidx.lifecycle,
    "androidx.lifecycle:lifecycle-viewmodel-ktx:%s" % versions.androidx.lifecycle,
    #"com.squareup.leakcanary:leakcanary-android:2.2",

    "androidx.activity:activity-ktx:%s" % versions.androidx.activity,

    _maven.artifact(
        group = "androidx.navigation",
        artifact = "navigation-runtime-ktx",
        version = versions.androidx.navigation,
#        exclusions = ["androidx.activity:activity-ktx","androidx.activity:activity"],
    ),

    _maven.artifact(
        group = "androidx.navigation",
        artifact = "navigation-ui-ktx",
        version = versions.androidx.navigation,
#        exclusions = ["androidx.fragment:fragment-ktx"],
    ),

    _maven.artifact(
        group = "androidx.navigation",
        artifact = "navigation-fragment-ktx",
        version = versions.androidx.navigation,
        exclusions = ["androidx.fragment:fragment-ktx"],
    ),
#    "androidx.window:window:1.0.0"
]

maven_test = [
    #    "com.applitools:eyes-android-espresso:4.7.6",
    #    "androidx.test:runner:1.3.0",
    #    "androidx.test:rules:1.3.0",
    #    "androidx.test.espresso:espresso-core:3.3.0",
    #    "androidx.test.espresso:espresso-contrib:3.3.0",
    #    "androidx.test.espresso:espresso-intents:3.3.0",
    #    "androidx.test.ext:junit-ktx:1.1.2",
]

maven = maven_main + maven_test

main_deps = parse_coordinates(maven_main) + [
    "//android/player",
    "//plugins/reference-assets/android:assets",
    "//jvm/utils",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//plugins/reference-assets/mocks:jar",
]

test_deps = parse_coordinates(maven_test) + [
    "//jvm/utils",
    "@androidx_eyes_components//aar",
]

maven_main = [
    "@maven//:androidx_navigation_navigation_runtime",
    "@maven//:androidx_navigation_navigation_ui_ktx",
    "@maven//:androidx_navigation_navigation_fragment_ktx",
    "@maven//:com_afollestad_material_dialogs_core",
    "@maven//:com_google_android_material_material",
    #"@maven//:com_squareup_leakcanary_leakcanary_android",

    # TODO: Pull these from j2v8-android-debug
    "@android_j2v8//aar",
    "@maven//:com_facebook_stetho_stetho",

    # TODO: Pull these from hermes-android
    #    "@maven//:com_facebook_fbjni_fbjni",
    #    "@maven//:com_facebook_react_hermes_android",
    "@maven//:com_facebook_fbjni_fbjni",
]

maven_test = [
    "@maven//:androidx_test_espresso_espresso_intents",
    "@maven//:androidx_test_ext_junit_ktx",
]

main_deps = maven_main + [
    "//jvm/utils",
    "//plugins/reference-assets/android:assets",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//tools/mocks:jar",
]

test_deps = maven_test + [
    "//jvm/utils",
]

maven_main = [
    "@maven//:androidx_navigation_navigation_runtime",
    "@maven//:androidx_navigation_navigation_ui_ktx",
    "@maven//:androidx_navigation_navigation_fragment_ktx",

    "@maven//:com_afollestad_material_dialogs_core",
    "@maven//:com_google_android_material_material",
    #"@maven//:com_squareup_leakcanary_leakcanary_android",
    "@maven//:com_github_AlexTrotsenko_j2v8_debugger",
    "@maven//:com_facebook_stetho_stetho"
]

maven_test = [
    "@maven//:androidx_test_espresso_espresso_intents",
    "@maven//:androidx_test_ext_junit_ktx"
]

maven = maven_main + maven_test

main_deps = maven_main + [
    "//jvm/utils",
    "//plugins/reference-assets/android:assets",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//tools/mocks:jar",
]

test_deps = maven_test + [
    "//jvm/utils"
]

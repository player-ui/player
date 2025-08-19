load("@rules_android//android:rules.bzl", "android_binary")
load("@rules_jvm_external//:defs.bzl", "artifact")
load("//android:defs.bzl", "kt_android")

maven_main = [
    "@maven//:androidx_navigation_navigation_runtime",
    "@maven//:androidx_navigation_navigation_ui_ktx",
    "@maven//:androidx_navigation_navigation_fragment_ktx",
    "@maven//:com_afollestad_material_dialogs_core",
    "@maven//:com_google_android_material_material",
    #"@maven//:com_squareup_leakcanary_leakcanary_android",
    # For when hermes-android _isn't_ included
    "@maven//:com_facebook_soloader_soloader",
]

maven_test = [
    "@maven//:androidx_test_espresso_espresso_intents",
    "@maven//:androidx_test_ext_junit_ktx",
    "@maven//:androidx_compose_ui_ui_test_junit4",
]

main_deps = maven_main + [
    "//jvm/utils",
    "//plugins/reference-assets/android",
    "//plugins/common-types/jvm",
    "//plugins/pending-transaction/jvm",
    "//tools/mocks:jar",

    # Unfortunately, native libs aren't included if this isn't specified (Bazel only issue)
    artifact("com.eclipsesource.j2v8:j2v8"),
]

test_deps = maven_test + [
    "//jvm/utils",
]

kt_android(
    name = "lib",
    main_deps = main_deps,

    # Disable local tests
    # TODO: Maybe specify just _classes, and then pull out lib for binary
    instrumented_test_srcs = [],

    # Disable strict visibility
    main_opts = "//jvm:test_options",

    # Disable publishing
    group = None,
    version = None,
)

android_binary(
    name = "demo",
    assets = glob(
        ["src/main/assets/mocks/**"],
        allow_empty = True,
    ),
    assets_dir = "src/main/assets",
    custom_package = "com.intuit.playerui.android.reference.demo",
    dex_shards = 4,
    manifest = ":src/main/AndroidManifest.xml",
    multidex = "native",
    resource_files = glob(
        ["src/main/res/**"],
        allow_empty = True,
    ),
    deps = [":lib"],
)

# kt_android_library(
#     name = "demo_ui_test",
#     srcs = glob(["src/androidTest/**/*.kt"]),
#     deps = test_deps + [":demo_lib"],
# )

# android_binary(
#     name = "demo_test_app",
#     custom_package = "com.intuit.playerui.android.reference.demo",
#     instruments = ":demo",
#     manifest = ":src/androidTest/AndroidManifest.xml",
#     deps = ["demo_ui_test"],
# )

# sh_binary(
#     name = "install",
#     srcs = ["scripts/androidinstall.sh"],
#     data = [":demo"],
#     deps = [],
# )

# sh_test(
#     name = "android_instrumentation_test",
#     size = "large",
#     timeout = "long",
#     srcs = ["scripts/androidtest.sh"],
#     data = [
#         ":demo",
#         ":demo_test_app",
#         "@android_test_orchestrator_apk//file",
#         "@android_test_services_apk//file",
#     ],
# )

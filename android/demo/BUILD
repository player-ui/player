load("@rules_android//android:rules.bzl", "android_binary")
load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("//android:defs.bzl", "kt_android")

main_deps = [
    "//jvm/utils",
    "//plugins/reference-assets/android",
    "//plugins/common-types/jvm",
    "//tools/mocks:jar",

    artifact("androidx.navigation:navigation-ui-ktx"),
    artifact("androidx.navigation:navigation-fragment-ktx"),
    artifact("com.afollestad.material-dialogs:core"),
    # Unfortunately, native libs aren't included if this isn't specified (Bazel only issue)
    artifact("com.eclipsesource.j2v8:j2v8"),
    # For when hermes-android _isn't_ included
    artifact("com.facebook.soloader:soloader"),
    artifact("com.google.android.material:material"),
]

test_deps = [
    "//android/testutils",

    artifact("androidx.test.espresso:espresso-intents"),
    artifact("androidx.test.ext:junit-ktx"),
    artifact("androidx.compose.ui:ui-test-junit4"),
]

kt_android(
    name = "demo_lib",
    main_deps = main_deps,

    # Disable local tests
    instrumented_test_classes = [],

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
    deps = [":demo_lib"],
)

kt_android_library(
    name = "demo_ui_test",
    srcs = glob(["src/androidTest/**/*.kt"]),
    deps = test_deps + [":demo_lib"],
    kotlinc_opts = "//jvm:test_options",
)

android_binary(
    name = "demo_test_app",
    custom_package = "com.intuit.playerui.android.reference.demo",
    instruments = ":demo",
    manifest = ":src/androidTest/AndroidManifest.xml",
    deps = ["demo_ui_test"],
)

sh_test(
    name = "android_instrumentation_test",
    size = "large",
    timeout = "long",
    srcs = ["scripts/androidtest.sh"],
    data = [
        ":demo",
        ":demo_test_app",
        "@android_test_orchestrator_apk//file",
        "@android_test_services_apk//file",
    ],
)

load("//android:defs.bzl", "kt_android")

main_exports = [
    "//android/player",
]

main_deps = main_exports + [
    "//plugins/a2ui/android:a2ui-android",
]

kt_android(
    name = "a2ui-android",
    main_deps = main_deps,
    main_exports = main_exports,
    # Relax explicit-API mode to match the other A2UI modules
    main_opts = "//jvm:test_options",
)

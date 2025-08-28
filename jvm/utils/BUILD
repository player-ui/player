load("//jvm:defs.bzl", "kt_player_module")

main_deps = [
    "//jvm/core",
]

kt_player_module(
    name = "utils",
    main_deps = main_deps,
    main_resources = ["//core/make-flow:make-flow_native_bundle"],
    test_deps = ["//jvm/testutils"],
    test_package = "com.intuit.playerui.utils",
)

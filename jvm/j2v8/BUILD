load("//jvm:defs.bzl", "kt_player_module")
load(":defs.bzl", "j2v8_platform")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm/j2v8/libs:j2v8_empty_compile_only",
]

# TODO: These should probably just be dependencies of headless
main_resources = glob(["src/main/resources/**"]) + [
    "//core/player:player_native_bundle",
]

test_deps = [
    "//jvm/testutils"
]


# TODO: Add core as associates and remove InternalPlayerApi?
#       May require creating shared module_name space.
kt_player_module(
    name = "j2v8",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.j2v8.bridge",
)

j2v8_platform("macos")

j2v8_platform("linux")

# TODO: These should probably be AARs?
j2v8_platform("android")

j2v8_platform("all")

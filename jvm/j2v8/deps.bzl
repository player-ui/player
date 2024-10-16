main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    "//jvm/j2v8/libs:j2v8_empty_compile_only",
    "//jvm/j2v8/libs:j2v8_debugger_compile_only",
]

# TODO: These should probably just be dependencies of headless
main_resources = [
    "//core/player:player_native_bundle",
]

test_deps = [
    "//jvm:kotlin_serialization",
]

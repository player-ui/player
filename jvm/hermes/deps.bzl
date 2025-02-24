main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    "@maven//:com_facebook_fbjni_fbjni_java_only",
    "@maven//:com_facebook_soloader_soloader",
    "//plugins/set-time-out/jvm:set-time-out",
    "//plugins/console-logger/jvm:console-logger"
]

# TODO: These should probably just be dependencies of headless
main_resources = [
    "//core/player:player_native_bundle",
]

test_deps = [
    "//jvm:kotlin_serialization",
]

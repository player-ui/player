main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    # TODO: Package these individually
    #    "@maven//:com_facebook_react_hermes_android",
    "@maven//:com_facebook_fbjni_fbjni_java_only",
    "@maven//:com_facebook_soloader_soloader",
    ":fbjni",
    "//jvm/hermes/src/main/jni:resources",
]

# TODO: These should probably just be dependencies of headless
main_resources = [
    #    "//core/player:player_native_bundle",
]

test_deps = [
    "//jvm:kotlin_serialization",
]

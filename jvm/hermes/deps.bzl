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
]

# TODO: These should probably just be dependencies of headless
main_resources = [
    "//jvm/hermes/src/main/jni:libhermes_jni.so",
    "//jvm/hermes/src/main/jni:libhermes.dylib",
    "//jvm/hermes/src/main/jni:libjsi.dylib",
    #    "//core/player:player_native_bundle",
]

test_deps = [
    "//jvm:kotlin_serialization",
]

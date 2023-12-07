load("//jvm:build.bzl", "distribution")

deps = {
    "macos": ["//jvm/j2v8/libs:j2v8_macos"],
    "linux": ["//jvm/j2v8/libs:j2v8_linux"],
    "android": ["@android_j2v8//aar"],
    "android-debug": [
        "//jvm/j2v8:j2v8-android",
        "@maven//:com_github_AlexTrotsenko_j2v8_debugger",
    ],
    "all": [
        "//jvm/j2v8:j2v8-macos",
        "//jvm/j2v8:j2v8-linux",
        "//jvm/j2v8:j2v8-android",
    ],
}

def j2v8_platform(platform):
    if platform not in deps:
        fail("platform must be defined in " + deps.keys())

    name = "j2v8-%s" % platform
    native.java_library(
        name = name,
        exports = [":j2v8"] + deps[platform],
        tags = ["maven_coordinates=%s:%s:{pom_version}" % ("com.intuit.player", name)],
        visibility = ["//visibility:public"],
    )

    distribution(
        name = name,
    )

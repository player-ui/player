load("//jvm:build.bzl", "DEFAULT_GROUP", "distribution")
load("@build_constants//:constants.bzl", "VERSION")

deps = {
    "macos": ["//jvm/j2v8/libs:j2v8_macos"],
    "linux": ["//jvm/j2v8/libs:j2v8_linux"],
    "android": ["@maven//:com_eclipsesource_j2v8_j2v8"],
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

def j2v8_platform(platform, group = DEFAULT_GROUP, version = VERSION):
    if platform not in deps:
        fail("platform must be defined in " + deps.keys())

    name = "j2v8-%s" % platform
    native.java_library(
        name = name,
        exports = [":j2v8"] + deps[platform],
        tags = ["maven_coordinates=%s:%s:%s" % (group, name, version)],
        visibility = ["//visibility:public"],
    )

    distribution(
        name = name,
        maven_coordinates = "%s:%s:%s" % (group, name, version),
    )

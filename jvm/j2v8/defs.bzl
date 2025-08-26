load("@build_constants//:constants.bzl", "GROUP", "VERSION")
load("@rules_java//java:java_library.bzl", "java_library")
load("//jvm:defs.bzl", "distribution")

deps = {
    "macos": [
        "//jvm/j2v8/libs:j2v8_macos",
    ],
    "linux": [
        "//jvm/j2v8/libs:j2v8_linux",
    ],
    "android": [
        "@maven//:com_eclipsesource_j2v8_j2v8",
    ],
    "all": [
        "//jvm/j2v8:j2v8-macos",
        "//jvm/j2v8:j2v8-linux",
        "//jvm/j2v8:j2v8-android",
    ],
}

def j2v8_platform(platform, group = GROUP, version = VERSION):
    if platform not in deps:
        fail("platform must be defined in " + deps.keys())

    name = "j2v8-%s" % platform
    java_library(
        name = name,
        exports = [":j2v8"] + deps[platform],
        tags = ["maven_coordinates=%s:%s:%s" % (group, name, version)],
        visibility = ["//visibility:public"],
    )

    distribution(
        name = name,
        maven_coordinates = "%s:%s:%s" % (group, name, version),
    )

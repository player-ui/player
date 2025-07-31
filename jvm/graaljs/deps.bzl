load("//jvm/dependencies:versions.bzl", "versions")

maven = [
    "org.graalvm.js:js:%s" % versions.runtimes.graaljs,
    "org.graalvm.js:js-scriptengine:%s" % versions.runtimes.graaljs,
    "org.graalvm.sdk:graal-sdk:%s" % versions.runtimes.graaljs,
]

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    # "//jvm:kotlin_serialization",
    "@maven//:org_graalvm_js_js",
    "@maven//:org_graalvm_js_js_scriptengine",
    "@maven//:org_graalvm_sdk_graal_sdk",
]

main_resources = [
    "//core/player:player_native_bundle"
]

test_deps = [
    # "//jvm:kotlin_serialization",
]

load("//jvm/dependencies:versions.bzl", "versions")
load("//plugins/reference-assets/android/src/androidTest/java/com/intuit/playerui/android/reference/assets/test:deps.bzl", maven_test = "maven")

maven_main = []

main_exports = [
    "//android/player",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    "//plugins/reference-assets/jvm:reference-assets",
    "//plugins/pending-transaction/jvm:pending-transaction",
]

maven = maven_main + maven_test

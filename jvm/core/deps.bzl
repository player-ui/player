# Maven dependencies
maven = []

# Common dependencies
associates = []

# Main dependencies
main_exports = [
    "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_core",
    "//jvm:kotlin_serialization",
]
main_deps = main_exports + [
    "@com_github_jetbrains_kotlin//:kotlin-reflect",
]
main_runtime_deps = []

# Test dependencies
test_deps = [
    "//plugins/reference-assets/jvm:reference-assets",
]
test_runtime_deps = []

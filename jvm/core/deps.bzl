# Maven dependencies
maven = []

# Common dependencies
associates = []

# Main dependencies
main_exports = [
    "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_core",
    
]
main_deps = main_exports + ["//jvm:kotlin_serialization",
    "@maven//:org_jetbrains_kotlin_kotlin_reflect",
]
main_runtime_deps = []

# Test dependencies
test_deps = [
    "//plugins/reference-assets/jvm:reference-assets",
    "//plugins/beacon/jvm:beacon",
]
test_runtime_deps = []

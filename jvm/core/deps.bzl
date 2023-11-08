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
    "@maven//:org_jetbrains_kotlin_kotlin_reflect"
]
main_runtime_deps = []

# Test dependencies
test_deps = [
     "//plugins/mocks:jar",
]
test_runtime_deps = []

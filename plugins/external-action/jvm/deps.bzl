maven = []

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//plugins/set-time-out/jvm:set-time-out",
]

main_resources = [
    "//plugins/external-action/core:core_native_bundle"
]

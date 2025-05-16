main_exports = [
    "//android/player",
]

maven_main = [
    "@maven//:androidx_activity_activity_compose",
    "@maven//:androidx_appcompat_appcompat",
    "@maven//:androidx_compose_foundation_foundation",
    "@maven//:androidx_compose_foundation_foundation_layout",
    "@maven//:androidx_compose_runtime_runtime",
    "@maven//:androidx_compose_ui_ui",
    "@maven//:androidx_compose_ui_ui_tooling",
]

main_deps = main_exports + maven_main + [
    "//jvm:kotlin_serialization",
    "//plugins/reference-assets/jvm:reference-assets",
    "//plugins/pending-transaction/jvm:pending-transaction",
]
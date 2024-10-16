main_exports = [
    "//android/player",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    "//plugins/reference-assets/jvm:reference-assets",
    "//plugins/pending-transaction/jvm:pending-transaction",
]
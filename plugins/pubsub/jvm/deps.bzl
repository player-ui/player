maven = []

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
]

main_resources = [
    "//plugins/pubsub/core:PubSubPlugin_Bundles",
]

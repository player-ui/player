// swift-tools-version: 5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

typealias PluginWithResources = (name: String, path: String)

// Simple plugins that just rely on core + their own JS bundle
let pluginList: [String] = [
    (name: "BaseBeaconPlugin", path: "beacon"),
    (name: "CheckPathPlugin", path: "check-path"),
    (name: "CommonExpressionsPlugin", path: "common-expressions"),
    (name: "CommonTypesPlugin", path: "common-types"), 
    (name: "ComputedPropertiesPlugin", path: "computed-properties"),
    (name: "ExpressionPlugin", path: "expression"),
    (name: "ExternalActionPlugin", path: "external-action"),
    (name: "PubSubPlugin", path: "pubsub"),
    (name: "StageRevertDataPlugin", path: "stage-revert-data"),
    (name: "TypesProviderPlugin", path: "types-provider")
]

let plugins: [(Target, Product)] = pluginList.map {
    (
        Target.playerPlugin(plugin: $0),
        Product.playerPlugin(name: $0.name)
    )
}

let package = Package(
    name: "PlayerUI",
    platforms: [
        .iOS(.v14),
        .macOS(.v11)
    ],
    products: [
        // Core
        .library(
            name: "PlayerUI",
            targets: ["PlayerUI", "PlayerUISwiftUI"]
        ),
        
        // Packages
        .library(
            name: "PlayerUIReferenceAssets",
            targets: ["PlayerUIReferenceAssets"]
        ),
        .library(
            name: "PlayerUILogger",
            targets: ["PlayerUILogger"]
        ),
        .library(
            name: "PlayerUITestUtilitiesCore",
            targets: ["PlayerUITestUtilitiesCore"]
        ),
        .library(
            name: "PlayerUITestUtilities",
            targets: ["PlayerUITestUtilities"]
        ),

        // Plugins
        .library(
            name: "PlayerUIBeaconPlugin",
            targets: ["PlayerUIBeaconPlugin"]
        ),
        .library(
            name: "PlayerUIExternalActionViewModifierPlugin",
            targets: ["PlayerUIExternalActionViewModifierPlugin"]
        ),
        .library(
            name: "PlayerUIMetricsPlugin",
            targets: ["PlayerUIMetricsPlugin"]
        ),
        .library(
            name: "PlayerUISwiftUICheckPathPlugin",
            targets: ["PlayerUISwiftUICheckPathPlugin"]
        ),
        .library(
            name: "PlayerUIPrintLoggerPlugin",
            targets: ["PlayerUIPrintLoggerPlugin"]
        ),
        .library(
            name: "PlayerUISwiftUIPendingTransactionPlugin",
            targets: ["PlayerUISwiftUIPendingTransactionPlugin"]
        ),
        .library(
            name: "PlayerUITransitionPlugin",
            targets: ["PlayerUITransitionPlugin"]
        )
    ] + plugins.map(\.1),
    dependencies: [
        .package(url: "https://github.com/intuit/swift-hooks.git", .upToNextMajor(from: "0.1.0")),
    ],
    targets: [
        // Packages
        .target(
            name: "PlayerUI",
            dependencies: [
                .product(name: "SwiftHooks", package: "swift-hooks"),
                .target(name: "PlayerUILogger")
            ],
            path: "ios/core",
            resources: [
                .process("Resources")
            ]
        ),
        .target(
            name: "PlayerUISwiftUI",
            dependencies: [
                .product(name: "SwiftHooks", package: "swift-hooks"),
                .target(name: "PlayerUI")
            ],
            path: "ios/swiftui"
        ),
        .target(
            name: "PlayerUILogger",
            dependencies: [
                .product(name: "SwiftHooks", package: "swift-hooks"),
            ],
            path: "ios/logger"
        ),
        .target(
            name: "PlayerUIReferenceAssets",
            dependencies: [
                .product(name: "SwiftHooks", package: "swift-hooks"),
                .target(name: "PlayerUI"),
                .target(name: "PlayerUIBeaconPlugin"),
                .target(name: "PlayerUISwiftUIPendingTransactionPlugin")
            ],
            path: "plugins/reference-assets/swiftui",
            resources: [
                .process("Resources")
            ]
        ),
        .target(
            name: "PlayerUITestUtilitiesCore",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI")
            ],
            path: "ios/test-utils-core",
            resources: [
                .process("Resources")
            ]
        ),
        .target(
            name: "PlayerUITestUtilities",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUITestUtilitiesCore")
            ],
            path: "ios/test-utils",
            linkerSettings: [.linkedFramework("XCTest")]
        ),

        // Plugins with dependencies
        .target(
            name: "PlayerUIBeaconPlugin",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI"),
                .target(name: "PlayerUIBaseBeaconPlugin")
            ],
            path: "plugins/beacon/swiftui"
        ),
        .target(
            name: "PlayerUIMetricsPlugin",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI")
            ],
            path: "plugins/metrics/swiftui",
            resources: [
                .process("Resources")
            ]
        ),
        .target(
            name: "PlayerUISwiftUICheckPathPlugin",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI"),
                .target(name: "PlayerUICheckPathPlugin")
            ],
            path: "plugins/check-path/swiftui"
        ),
        .target(
            name: "PlayerUIExternalActionViewModifierPlugin",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI"),
                .target(name: "PlayerUIExternalActionPlugin")
            ],
            path: "plugins/external-action/swiftui"
        ),
        // Swift only plugins
        .target(
            name: "PlayerUIPrintLoggerPlugin",
            dependencies: [
                .target(name: "PlayerUI")
            ],
            path: "plugins/console-logger/ios"
        ),
        .target(
            name: "PlayerUISwiftUIPendingTransactionPlugin",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI")
            ],
            path: "plugins/pending-transaction/swiftui"
        ),
        .target(
            name: "PlayerUITransitionPlugin",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI")
            ],
            path: "plugins/transition/swiftui"
        )
    ] + plugins.map(\.0)
)


extension Product {
    static func playerPlugin(name: String) -> Product {
        .library(name: "PlayerUI\(name)", targets: ["PlayerUI\(name)"])
    }
}
extension Target {
    static func playerPlugin(plugin: PluginWithResources) -> Target {
        .target(
            name: "PlayerUI\(plugin.name)",
            dependencies: [
                .target(name: "PlayerUI")
            ],
            path: "plugins/\(plugin.path)/ios",
            resources: [
                .process("Resources")
            ]
        )
    }
}
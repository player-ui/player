// swift-tools-version: 5.5
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

typealias SwiftPlugin = (name: String, path: String, resources: Bool)
typealias SwiftUIPlugin = (name: String, path: String, dependencies: [String], resources: Bool)

// Simple iOS plugins that just rely on PlayerUI and optionally JS resources
let ios_plugins: [SwiftPlugin] = [
    (name: "AsyncNodePlugin", path: "async-node", resources: true),
    (name: "BaseBeaconPlugin", path: "beacon", resources: true),
    (name: "CheckPathPlugin", path: "check-path", resources: true),
    (name: "CommonExpressionsPlugin", path: "common-expressions", resources: true),
    (name: "CommonTypesPlugin", path: "common-types", resources: true),
    (name: "ComputedPropertiesPlugin", path: "computed-properties", resources: true),
    (name: "ExpressionPlugin", path: "expression", resources: true),
    (name: "ExternalActionPlugin", path: "external-action", resources: true),
    (name: "PubSubPlugin", path: "pubsub", resources: true),
    (name: "StageRevertDataPlugin", path: "stage-revert-data", resources: true),
    (name: "TypesProviderPlugin", path: "types-provider", resources: true),
    (name: "PrintLoggerPlugin", path: "console-logger", resources: false)
]

// SwiftUI Plugins
let swiftui_plugins: [SwiftUIPlugin] = [
    (name: "BeaconPlugin", path: "beacon", dependencies: ["BaseBeaconPlugin"], resources: false),
    (name: "MetricsPlugin", path: "metrics", dependencies: [], resources: true),
    (name: "SwiftUICheckPathPlugin", path: "check-path", dependencies: ["CheckPathPlugin"], resources: false),
    (name: "ExternalActionViewModifierPlugin", path: "external-action", dependencies: ["ExternalActionPlugin"], resources: false),
    (name: "SwiftUIPendingTransactionPlugin", path: "pending-transaction", dependencies: [], resources: false),
    (name: "TransitionPlugin", path: "transition", dependencies: [], resources: false),
]

// Map plugins to Target / Product entries
let plugins: [(Target, Product)] = ios_plugins.map {
    (
        Target.swiftPlugin(plugin: $0),
        Product.playerPlugin(name: $0.name)
    )
} + swiftui_plugins.map {
    (
        Target.swiftuiPlugin(plugin: $0),
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
        .playerPackage(name: "PlayerUI"),
        .playerPackage(name: "PlayerUISwiftUI"),
        .playerPackage(name: "PlayerUIReferenceAssets"),
        .playerPackage(name: "PlayerUILogger"),
        .playerPackage(name: "PlayerUITestUtilities"),
        .playerPackage(name: "PlayerUITestUtilitiesCore"),
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
            path: "apple/core",
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
            path: "apple/ios"
        ),
        .target(
            name: "PlayerUILogger",
            dependencies: [
                .product(name: "SwiftHooks", package: "swift-hooks"),
            ],
            path: "apple/logger"
        ),
        .target(
            name: "PlayerUIReferenceAssets",
            dependencies: [
                .product(name: "SwiftHooks", package: "swift-hooks"),
                .target(name: "PlayerUI"),
                .target(name: "PlayerUIBeaconPlugin"),
                .target(name: "PlayerUISwiftUIPendingTransactionPlugin")
            ],
            path: "plugins/reference-assets/ios",
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
            path: "apple/test-utils-core",
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
            path: "apple/test-utils",
            linkerSettings: [.linkedFramework("XCTest")]
        )
    ] + plugins.map(\.0)
)


extension Product {
    static func playerPlugin(name: String) -> Product {
        playerPackage(name: "PlayerUI\(name)")
    }
    static func playerPackage(name: String) -> Product {
        .library(name: name, targets: [name])
    }
}
extension Target {
    static func swiftPlugin(plugin: SwiftPlugin) -> Target {
        let resources: [Resource] = plugin.resources ? [ .process("Resources") ] : []
        return .target(
            name: "PlayerUI\(plugin.name)",
            dependencies: [
                .target(name: "PlayerUI")
            ],
            path: "plugins/\(plugin.path)/apple",
            resources: resources
        )
    }

    static func swiftuiPlugin(plugin: SwiftUIPlugin) -> Target {
        let resources: [Resource] = plugin.resources ? [ .process("Resources") ] : []
        return .target(
            name: "PlayerUI\(plugin.name)",
            dependencies: [
                .target(name: "PlayerUI"),
                .target(name: "PlayerUISwiftUI")
            ]  + plugin.dependencies.map { Dependency.target(name: "PlayerUI\($0)") },
            path: "plugins/\(plugin.path)/ios",
            resources: resources
        )
    }
}

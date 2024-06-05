// swift-tools-version: 5.7
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

// SPM doesn't isolate dependencies that are not used by products
// So relying on a tool, like SwiftLint, a consuming user will still need to resolve that
// even though they would not use it
// this can cause conflicts for packages not used by the product at runtime
//
// So this file is used to generate dependencies for bazel so we can keep the actual Package.swift clean
// since the spm rules for bazel only work from a Package.swift
let package = Package(
    name: "PlayerUIBazelDependencies",
    platforms: [
        .macOS(.v11)
    ],
    products: [],
    dependencies: [
        // Actual Dependencies
        .package(url: "https://github.com/intuit/swift-hooks.git", .upToNextMajor(from: "0.1.0")),
        .package(url: "https://github.com/realm/SwiftLint.git", .upToNextMajor(from: "0.54.0")),

        // Testing Dependencies
        .package(url: "https://github.com/nalexn/viewinspector.git", .upToNextMajor(from: "0.9.10"))
    ],
    targets: []
)

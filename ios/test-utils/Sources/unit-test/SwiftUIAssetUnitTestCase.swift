//
//  SwiftUIAssetUnitTestCase.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/8/21.
//

import Foundation
import JavaScriptCore
import SwiftUI
import Combine
import XCTest

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
import PlayerUITestUtilitiesCore
#endif

/**
 A base class to use for SwiftUIAsset unit tests
 */
open class SwiftUIAssetUnitTestCase: XCTestCase, NativePlugin {
    // MARK: NativePlugin protocol adherence

    /// The name of this plugin
    public var pluginName: String = "AssetUnitTestCase"

    /**
     Apply this class as a plugin to a `HeadlessPlayer` implementation
     - parameters:
        - player: Player to apply to
     */
    public func apply<P: HeadlessPlayer>(player: P) {
        if let registry = player.assetRegistry as? SwiftUIRegistry {
            register(registry: registry)
        }
    }

    // MARK: Public API
    /**
     Function to be overriden by subclass to register assets for use in the unit tests
     - parameters:
        - registry: The SwiftUIRegistry to register assets to
     */
    open func register(registry: SwiftUIRegistry) {}

    /**
     Function to provide additional plugins when using `getAsset(_:)`
     - returns: An array of `NativePlugin`s to add to the flow parsing
     */
    open func plugins() -> [NativePlugin] { [] }

    public var helper = AssetTestHelper.swiftui

    public var context: JSContext { helper.context }

    /**
     Gets an asset from the given JSON if it is decodable
     - parameters:
        - json: The JSON definition for the asset you want to construct
        - plugins: Additional plugins to include when resolving the asset
     - returns: The decoded asset if it was possible to decode
     */
    public func getAsset<T>(_ json: String, plugins: [NativePlugin] = []) async -> T? {
        await helper.getAsset(json, plugins: plugins + self.plugins() + [self])
    }

    /**
     Wraps a completion handler into a WrappedFunction for using XCTestExpectations to test functions
     that are added to assets via a JS transform
     - parameters:
        - completion: A completion handler to run when the function is invoked
     - returns: A WrappedFunction that will call your completion handler
     */
    public func getWrappedFunction<T>(completion: @escaping () -> Void) -> WrappedFunction<T>? {
        helper.getWrappedFunction(completion: completion)
    }
}

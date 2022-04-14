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

/**
 A base class to use for SwiftUIAsset unit tests
 */
open class SwiftUIAssetUnitTestCase: AssetUnitTestCaseBase, NativePlugin {
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

    /**
     Gets an asset from the given JSON if it is decodable
     - parameters:
        - json: The JSON definition for the asset you want to construct
     - returns: The decoded asset if it was possible to decode
     */
    public func getAsset<T>(_ json: String, plugins: [NativePlugin] = []) -> T? {
        guard let flow = makeFlow(json) else { return nil }
        let player = TestPlayer<WrappedAsset, SwiftUIRegistry>(plugins: plugins + self.plugins() + [self], registry: SwiftUIRegistry(logger: TapableLogger()))
        let update = expectation(description: "initial view update")
        var rootVal: JSValue?
        player.hooks?.viewController.tap({ (viewController) in
            viewController.hooks.view.tap { (view) in
                view.hooks.onUpdate.tap { val in
                    rootVal = val
                    update.fulfill()
                }
            }
        })
        player.start(flow: flow) {_ in }
        wait(for: [update], timeout: 2)
        let jsValue = context.createAssetJsValue(string: json)
        do {
            return try player.assetRegistry.decode(jsValue) as? T
        } catch {
            // If the user passed in an entire flow, decode the asset that was the root of
            // the flow
            guard let root = rootVal else { return nil }
            return try? player.assetRegistry.decode(root) as? T
        }
    }

    /**
     Wraps a completion handler into a WrappedFunction for using XCTestExpectations to test functions
     that are added to assets via a JS transform
     - parameters:
        - completion: A completion handler to run when the function is invoked
     - returns: A WrappedFunction that will call your completion handler
     */
    public func getWrappedFunction<T>(completion: @escaping () -> Void) -> WrappedFunction<T>? {
        let callback: @convention(block) (JSValue) -> JSValue = { value in
            completion()
            return value
        }

        guard
            let function = JSValue(object: callback, in: context)
        else { return nil }
        return WrappedFunction(rawValue: function)
    }
}

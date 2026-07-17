//
//  PlayerView.swift
//
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/// A wrapper around the JS View in the core player
public class PlayerView: CreatedFromJSValue {
    /// The hooks that can be tapped into
    public let hooks: ViewHooks

    /// The JSValue that backs this wrapper
    let value: JSValue

    /// Gets the ID for this view
    public var id: String {
        value
            .objectForKeyedSubscript("initialView")?
            .objectForKeyedSubscript("id")?
            .toString() ?? "something went really wrong and this view has no id"
    }

    /// Construct a View from a JSValue
    /// - parameters:
    ///   - value: The JSValue that is the View
    public init(_ value: JSValue) {
        self.value = value
        hooks = ViewHooks(onUpdate: Hook<JSValue>(baseValue: self.value, name: "onUpdate"))
    }

    /// Creates an instance from a JSValue, used for generic construction
    /// - parameters:
    ///   - value: The JSValue to construct from
    public static func createInstance(value: JSValue) -> PlayerView {
        PlayerView(value)
    }

    /// Typealias for associated type
    public typealias T = PlayerView
}

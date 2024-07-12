//
//  ViewController.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
 A wrapper around the JS ViewController in the core player
 */
public class ViewController: CreatedFromJSValue {
    /// Typealias for associated type
    public typealias T = ViewController

    /**
     Creates an instance from a JSValue, used for generic construction
     - parameters:
        - value: The JSValue to construct from
     */
    public static func createInstance(value: JSValue) -> ViewController { ViewController(value) }

    /// The JSValue that backs this wrapper
    private let value: JSValue

    /// The hooks that can be tapped into
    public let hooks: ViewControllerHooks

    /// The current view being managed by the View Controller
    public var currentView: PlayerView? {
        guard let view = value.objectForKeyedSubscript("currentView") else { return nil }
        return PlayerView(view)
    }

    /**
     Construct a ViewController from a JSValue
     - parameters:
        - value: The JSValue that is the ViewController
     */
    public init(_ value: JSValue) {
        self.value = value
        self.hooks = ViewControllerHooks(
            view: Hook<PlayerView>(baseValue: self.value, name: "view")
        )
    }
}

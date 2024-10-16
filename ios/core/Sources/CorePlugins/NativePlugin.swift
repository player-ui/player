//
//  NativePlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 6/30/20.
//

import Foundation
import JavaScriptCore

/**
 Required functions for a Native Plugin to register with the `Player`
 */
public protocol NativePlugin {
    /// The name of this plugin
    var pluginName: String { get }

    /**
     Apply the plugin to Player
     - parameters:
        - player: Player to apply to
     */
    func apply<P: HeadlessPlayer>(player: P)
}

public extension NativePlugin {
    func apply<P>(player: P) where P: HeadlessPlayer {}
}

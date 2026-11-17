//
//  NativePlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 6/30/20.
//

import Foundation
import JavaScriptCore

/// Required functions for a Native Plugin to register with the `Player`
public protocol NativePlugin {
    /// The name of this plugin
    var pluginName: String { get }

    /// Apply the plugin to Player
    /// - parameters:
    ///   - player: Player to apply to
    func apply(player: some HeadlessPlayer)

    /// Called when this plugin's JSContext is being unloaded. Release any references
    /// into it here so a late callback can't invoke into a torn-down context.
    func teardown()
}

public extension NativePlugin {
    func apply(player _: some HeadlessPlayer) {}
    func teardown() {}
}

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

    /// Called when this plugin's underlying JSContext is being unloaded (e.g. on a
    /// ManagedPlayer flow transition). Implementations should release any references
    /// into that context here, so a late/async callback can't invoke into a JSContext
    /// that has already been torn down.
    func teardown()
}

public extension NativePlugin {
    func apply(player _: some HeadlessPlayer) {}
    func teardown() {}
}

//
//  WeakPlugin.swift
//  PlayerUI
//

import PlayerUI

/// Weak reference to a `NativePlugin`, so `SwiftUIPlayer.Context` (possibly global, e.g.
/// `sharedManaged`) can tear down applied plugins without keeping them alive. Struct plugins
/// box to a temporary and drop out immediately; tearing down a copy would release nothing.
struct WeakPlugin {
    /// The plugin instance, if it is a class and is still alive.
    private weak var object: AnyObject?

    /// Wraps `plugin` without retaining it. `NativePlugin` isn't class-bound, so it's stored
    /// as `AnyObject` and cast back on access.
    init(_ plugin: NativePlugin) {
        object = plugin as AnyObject
    }

    /// The wrapped plugin, or `nil` if it has been deallocated (or was a value type).
    var plugin: NativePlugin? {
        object as? NativePlugin
    }
}

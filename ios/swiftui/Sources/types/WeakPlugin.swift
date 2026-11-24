//
//  WeakPlugin.swift
//  PlayerUI
//

import PlayerUI

/// Weakly tracks plugins for teardown without extending their lifetime.
/// Important for long-lived contexts like `sharedManaged`.
/// Struct plugins aren't retained; tearing down a copy has no effect.
struct WeakPlugin {
    /// Weak reference to the plugin
    /// - Becomes `nil` once the plugin is deallocated.
    /// - Structs are `nil` from the start: they aren't objects, so the cast makes a throwaway
    ///   copy that is deallocated immediately.
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

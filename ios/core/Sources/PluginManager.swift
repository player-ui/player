//
//  PluginManager.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2025-02-25.
//

import Foundation
import SwiftHooks

public class PluginManager {
    private var plugins: [NativePlugin] = []

    public var hooks = PluginManagerHooks()

    public init() {
        setupHooks()
    }

    private func setupHooks() {
        // Registering the plugin
        hooks.registerPlugin.tap(name: "RegisterPluginAppend") { plugin in
            if !self.plugins.contains(where: { $0.pluginName == plugin.pluginName }) {
                self.plugins.append(plugin)
            }
        }

        // Finding the plugin
        hooks.findPlugin.tap(name: "FindPlugin") { pluginType in
            guard let match = self.plugins.first(where: { type(of: $0) == pluginType }) else {
                return .skip
            }
            return .bail(match)
        }
    }

    // Method to add a plugin to the Manager where pluginNames are unique
    public func registerPlugin(_ plugin: NativePlugin) {
        self.hooks.registerPlugin.call(plugin)
    }

    // Method to retrieve a plugin by type
    public func findPlugin<T: NativePlugin>(ofType type: T.Type) -> T? {
        return self.hooks.findPlugin.call(type) as? T
    }
}

public struct PluginManagerHooks {
    // Hook for registering a new plugin
    public let registerPlugin = SyncHook<NativePlugin>()

    // Hook for finding plugins
    public let findPlugin = SyncBailHook<NativePlugin.Type, NativePlugin?>()
}

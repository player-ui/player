import Foundation
import JavaScriptCore
import PlayerUI

/// Wrapper around the JS `StateContextPlugin`. Registering it mirrors Player
/// runtime state into the `ContextPlugin` store and publishes the aggregated
/// `player.state` entry, which can be read as a typed `PlayerStateContext`:
///
/// ```swift
/// contextPlugin.get(name: "player.state", as: PlayerStateContext.self)?
///    .flow?.transition?()
/// ```
///
/// Auto-registers a `ContextPlugin` on the JS side if one isn't already present.
public class StateContextPlugin: JSBasePlugin, NativePlugin {
    public convenience init() {
        self.init(fileName: "ContextPlugin.native", pluginName: "ContextPlugin.StateContextPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
    }
}

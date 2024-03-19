import Foundation
import SwiftUI

/// SwiftUI Version of `CheckPathPlugin` that puts itself into `\.checkPath` in EnvironmentValues
public class SwiftUICheckPathPlugin: BaseCheckPathPlugin, NativePlugin {
    /**
     Constructs the SwiftUICheckPathPlugin
     */
    public convenience init() {
        self.init(fileName: "check-path-plugin.prod", pluginName: "CheckPathPlugin.CheckPathPlugin")
    }

    public func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        player.hooks?.view.tap(name: self.pluginName) { [weak self] view in
            AnyView(view.environment(\.checkPath, self))
        }
    }
}

struct CheckPathPluginKey: EnvironmentKey {
    static var defaultValue: BaseCheckPathPlugin?
}

public extension EnvironmentValues {
    /// The `BaseCheckPathPlugin` for this player instance if one was included
    internal(set) var checkPath: BaseCheckPathPlugin? {
        get { self[CheckPathPluginKey.self] }
        set { self[CheckPathPluginKey.self] = newValue }
    }
}

import Foundation
import SwiftUI

#if SWIFT_PACKAGE
    import PlayerUI
    import PlayerUICheckPathPlugin
    import PlayerUISwiftUI
#endif

/// SwiftUI Version of `CheckPathPlugin` that puts itself into `\.checkPath` in EnvironmentValues
public class SwiftUICheckPathPlugin: BaseCheckPathPlugin, NativePlugin {
    /// Constructs the SwiftUICheckPathPlugin
    public convenience init() {
        self.init(fileName: "CheckPathPlugin.native", pluginName: "CheckPathPlugin.CheckPathPlugin")
    }

    public func apply<P: HeadlessPlayer>(player: P) {
        guard let player = player as? SwiftUIPlayer else { return }
        player.hooks?.view.tap(name: pluginName) { [weak self] view in
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

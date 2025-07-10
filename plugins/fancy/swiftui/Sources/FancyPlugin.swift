import SwiftUICore

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

class FancyPlugin: JSBasePlugin, NativePlugin {
    private var isFancy: Bool = true

    convenience init(isFancy: Bool = true) {
        self.init(
            fileName: "FancyPlugin.native",
            pluginName: "FancyPlugin.FancyPlugin"
        )
        self.isFancy = isFancy
    }

    func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }
        player.hooks?.view.tap(name: pluginName) { (view: AnyView) -> AnyView in
            return AnyView(view.environment(\.isFancy, self.isFancy))
        }
    }

    // This allows the base plugin to be loaded
    override open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(
            name: fileName, ext: "js",
            bundle: Bundle.module,
        )
        #else
        ResourceUtilities.urlForFile(
            name: fileName, ext: "js",
            bundle: Bundle(for: FancyPlugin.self),
            pathComponent: "PlayerUI_FancyPlugin.bundle"
        )
        #endif
    }

    // Pass the isFancy argument to the JS plugin
    override open func getArguments() -> [Any] {
        return [isFancy]
    }
}

extension EnvironmentValues {
    /// Whether or not to make the view fancy when rendered
    @Entry var isFancy: Bool = true
}

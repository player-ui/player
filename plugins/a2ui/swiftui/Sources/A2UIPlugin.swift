import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/**
 SwiftUI renderers for the A2UI v0.9.1 component catalog.

 This single plugin loads the `A2UIPlugin` JS bundle — which registers the content
 adapter (`adaptA2UIToFlow`), asset transforms, and expression functions — and
 registers the matching SwiftUI assets onto the `SwiftUIRegistry`.

 Start A2UI content with `StartOptions.a2ui`, e.g.
 `SwiftUIPlayer(flow: snapshot, plugins: [A2UIPlugin()], result: $result, startOptions: .a2ui)`.
 */
public class A2UIPlugin: JSBasePlugin, NativePlugin {
    /**
     Tap into `Player` hooks during player creation to register the A2UI assets.
     - parameters:
        - player: The `HeadlessPlayer` that is applying this plugin
     */
    public func apply<P>(player: P) where P: HeadlessPlayer {
        guard let registry = player.assetRegistry as? SwiftUIRegistry else { return }
        // Asset type strings are PascalCase — they must match the adapter output exactly.
        registry.register("Row", asset: A2UIRowAsset.self)
        registry.register("Column", asset: A2UIColumnAsset.self)
        registry.register("List", asset: A2UIListAsset.self)
        registry.register("Text", asset: A2UITextAsset.self)
        registry.register("Image", asset: A2UIImageAsset.self)
        registry.register("Icon", asset: A2UIIconAsset.self)
        registry.register("Divider", asset: A2UIDividerAsset.self)
        registry.register("Button", asset: A2UIButtonAsset.self)
        registry.register("TextField", asset: A2UITextFieldAsset.self)
        registry.register("CheckBox", asset: A2UICheckBoxAsset.self)
        registry.register("Slider", asset: A2UISliderAsset.self)
        registry.register("DateTimeInput", asset: A2UIDateTimeInputAsset.self)
        registry.register("ChoicePicker", asset: A2UIChoicePickerAsset.self)
        registry.register("Card", asset: A2UICardAsset.self)
        registry.register("Modal", asset: A2UIModalAsset.self)
        registry.register("Tabs", asset: A2UITabsAsset.self)
    }

    /**
     Constructs the A2UIPlugin
     */
    public convenience init() {
        self.init(fileName: "A2UIPlugin.native", pluginName: "A2UIPlugin.A2UIPlugin")
    }

    /**
     Retrieve the A2UI JS bundle
     - parameters:
        - fileName: The name of the file to fetch
     - returns: A URL if it exists in the bundle
     */
    override open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: A2UIPlugin.self),
            pathComponent: "PlayerUI_A2UI.bundle"
        )
        #endif
    }
}

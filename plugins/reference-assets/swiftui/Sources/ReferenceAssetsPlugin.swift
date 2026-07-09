import PlayerUI
import PlayerUISwiftUI
import SwiftUI

/// Reference Assets for the `SwiftUIPlayer`
public class ReferenceAssetsPlugin: JSBasePlugin, NativePlugin {
    /// Constructs the SwiftUIReferenceAssetsPlugin
    public convenience init() {
        self.init(
            fileName: "ReferenceAssetsPlugin.native",
            pluginName: "ReferenceAssetsPlugin.ReferenceAssetsPlugin"
        )
    }

    /// Tap into `Player` hooks during player creation
    /// - parameters:
    ///   - player: The `HeadlessPlayer` that is applying this plugin
    public func apply(player: some HeadlessPlayer) {
        if let registry = player.assetRegistry as? SwiftUIRegistry {
            registry.register("action", asset: ActionAsset.self)
            registry.register("text", asset: TextAsset.self)
            registry.register("collection", asset: CollectionAsset.self)
            registry.register("input", asset: InputAsset.self)
            registry.register("info", asset: InfoAsset.self)
        }
    }

    /// Retrieve the transforms from the JS bundle
    /// - parameters:
    ///   - fileName: The name of the file to fetch
    /// - returns: A URL if it exists in the bundle
    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
    }
}

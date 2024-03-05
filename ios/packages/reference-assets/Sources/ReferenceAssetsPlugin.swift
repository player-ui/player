import SwiftUI

/**
 Reference Assets for the `SwiftUIPlayer`
 */
public class ReferenceAssetsPlugin: JSBasePlugin, NativePlugin {
    /**
    Tap into `Player` hooks during player creation
    - parameters:
       - player: The `HeadlessPlayer` that is applying this plugin
    */
    public func apply<P>(player: P) where P: HeadlessPlayer {
        if let player = player as? SwiftUIPlayer {
            player.assetRegistry.register("action", asset: ActionAsset.self)
            player.assetRegistry.register("text", asset: TextAsset.self)
            player.assetRegistry.register("collection", asset: CollectionAsset.self)
            player.assetRegistry.register("input", asset: InputAsset.self)
            player.assetRegistry.register("info", asset: InfoAsset.self)
        }
    }
    /**
     Constructs the SwiftUIReferenceAssetsPlugin
     */
    public convenience init() {
        self.init(fileName: "reference-assets-plugin.prod", pluginName: "ReferenceAssetsPlugin.ReferenceAssetsPlugin")
    }

    /**
     Retrieve the transforms from the JS bundle
     - parameters:
        - fileName: The name of the file to fetch
     - returns: A URL if it exists in the bundle
     */
    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: ReferenceAssetsPlugin.self), pathComponent: "PlayerUI_ReferenceAssets.bundle")
    }
}

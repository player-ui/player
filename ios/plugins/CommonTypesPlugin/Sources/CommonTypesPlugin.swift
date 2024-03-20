/**
 Wrapper to instantiate @player-ui/common-types-plugin
 */
public class CommonTypesPlugin: JSBasePlugin, NativePlugin {
    /**
     Constructs a PartialMatchRegistry JS object
     */
    public convenience init() {
        self.init(fileName: "common-types-plugin.prod", pluginName: "CommonTypesPlugin.CommonTypesPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: CommonTypesPlugin.self), pathComponent: "PlayerUI_CommonTypesPlugin.bundle")
    }
}

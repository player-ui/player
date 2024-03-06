/**
 Wrapper to instantiate @player/computed-properties-plugin
 */
public class ComputedPropertiesPlugin: JSBasePlugin, NativePlugin {
    /**
     Constructs a PartialMatchRegistry JS object
     */
    public convenience init() {
        self.init(fileName: "computed-properties-plugin.prod", pluginName: "ComputedPropertiesPlugin.ComputedPropertiesPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: ComputedPropertiesPlugin.self),
            pathComponent: "PlayerUI_ComputedPropertiesPlugin.bundle"
        )
    }
}

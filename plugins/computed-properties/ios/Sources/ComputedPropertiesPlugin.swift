import Foundation

#if SWIFT_PACKAGE
import PlayerUI
#endif

/**
 Wrapper to instantiate @player/computed-properties-plugin
 */
public class ComputedPropertiesPlugin: JSBasePlugin, NativePlugin {
    /**
     Constructs a PartialMatchRegistry JS object
     */
    public convenience init() {
        self.init(fileName: "ComputedPropertiesPlugin.native", pluginName: "ComputedPropertiesPlugin.ComputedPropertiesPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: ComputedPropertiesPlugin.self),
            pathComponent: "ComputedPropertiesPlugin.bundle"
        )
        #endif
    }
}

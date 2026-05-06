import Foundation

import PlayerUI

/**
 Wrapper to instantiate @player-ui/common-types-plugin
 */
public class CommonTypesPlugin: JSBasePlugin, NativePlugin {
    /**
     Constructs a PartialMatchRegistry JS object
     */
    public convenience init() {
        self.init(fileName: "CommonTypesPlugin.native", pluginName: "CommonTypesPlugin.CommonTypesPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
    }
}

import Foundation
import JavaScriptCore

import PlayerUI

/**
 Plugin to stage data changes until an approved transition is made
 */
public class StageRevertDataPlugin: JSBasePlugin, NativePlugin {
    /**
     Constructs the StageRevertDataPlugin
     */
    public convenience init() {
        self.init(fileName: "StageRevertDataPlugin.native", pluginName: "StageRevertDataPlugin.StageRevertDataPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
    }
}

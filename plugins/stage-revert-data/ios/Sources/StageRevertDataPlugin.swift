import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
#endif

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
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: StageRevertDataPlugin.self), pathComponent: "PlayerUI_StageRevertDataPlugin.bundle")
        #endif
    }
}

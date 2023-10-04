import Foundation
import JavaScriptCore

/**
 Plugin to stage data changes until an approved transition is made
 */
public class StageRevertDataPlugin: JSBasePlugin, NativePlugin {
    /**
     Constructs the StageRevertDataPlugin
     */
    public convenience init() {
        self.init(fileName: "stage-revert-data-plugin.prod", pluginName: "StageRevertDataPlugin.StageRevertDataPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: StageRevertDataPlugin.self), pathComponent: "StageRevertDataPlugin.bundle")
    }
}

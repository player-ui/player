/**
 Wrapper to instantiate @player-ui/common-expressions-plugin
 */
public class CommonExpressionsPlugin: JSBasePlugin, NativePlugin {
    /**
     Constructs a PartialMatchRegistry JS object
     */
    public convenience init() {
        self.init(
            fileName: "common-expressions-plugin.prod",
            pluginName: "CommonExpressionsPlugin.CommonExpressionsPlugin"
        )
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: CommonExpressionsPlugin.self), pathComponent: "CommonExpressionsPlugin.bundle")
    }
}

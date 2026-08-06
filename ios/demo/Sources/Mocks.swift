import Foundation
import PlayerUITestUtilitiesCore

/// Contains all the mock JSON flows
struct Mocks {
    /// For asset demos
    let assetSections: [FlowLoader.FlowSection]
    /// For demoing plugins
    let pluginsSections: [FlowLoader.FlowSection]
    /// For demoing the A2UI assets
    let a2uiSections: [FlowLoader.FlowSection]

    init() {
        assetSections = FlowLoader.loadTree(at: Bundle.getMocksBundlePath(for: "AssetMocks"))
        pluginsSections = FlowLoader.loadTree(at: Bundle.getMocksBundlePath(for: "PluginMocks"))
        a2uiSections = FlowLoader.loadTree(at: Bundle.getMocksBundlePath(for: "A2UIMocks"))
    }
}

private extension Bundle {
    private static func getMocksBundle(for name: String) -> Self {
        guard let path = Bundle.main.path(forResource: name, ofType: "bundle"),
              let bundle = Self(path: path) else {
            fatalError("Could not find Bundle with name '\(name)'")
        }
        return bundle
    }

    static func getMocksBundlePath(for name: String) -> String {
        guard let path = getMocksBundle(for: name).resourcePath else {
            fatalError("Could not find resourcePath for found Bundle with name '\(name)'")
        }
        return path
    }
}

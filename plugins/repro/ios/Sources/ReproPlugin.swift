//
//  ReproPlugin.swift
//  PlayerUI
//

import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
#endif

/**
 A very basic repro plugin for iOS
 */
open class BaseReproPlugin: JSBasePlugin {
    /**
     Constructs a ReproPlugin
     */
    public convenience init() {
        self.init(fileName: "ReproPlugin.native", pluginName: "ReproPlugin.ReproPlugin")
    }

    override open func getUrlForFile(fileName: String) -> URL? {
#if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
#else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: AsyncNodePluginPlugin.self),
            pathComponent: "PlayerUIAsyncNodePlugin.bundle"
        )
#endif
    }
}


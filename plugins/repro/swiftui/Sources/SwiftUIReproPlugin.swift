//
//  SwiftUIReproPlugin.swift
//  PlayerUI
//

import Foundation
import JavaScriptCore
import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
import PlayerUIBaseReproPlugin
#endif

/**
 A very basic SwiftUI repro plugin
 */
open class ReproPlugin: BaseReproPlugin, NativePlugin {
    open func apply<P>(player: P) where P: HeadlessPlayer {
        guard let player = player as? SwiftUIPlayer else { return }

        // Will be logged
        player.logger.d("[REPRO] Entered ReproPlugin")

        player.hooks?.view.tap(name: pluginName) { view in
            // Will be logged
            player.logger.d("[REPRO] In view hook")
            return view
        }

        // Will be logged
        player.logger.d("[REPRO] Exiting ReproPlugin")
    }
}

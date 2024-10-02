//
//  PrintLoggerPlugin.swift
//  PlayerUI
//
//  Created by Harris Borawski on 8/26/21.
//

import Foundation

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUILogger
#endif

/**
 A Logger plugin that prints messages
 */
public class PrintLoggerPlugin: NativePlugin {
    public var pluginName: String = "PrintLoggerPlugin"

    private var logLevel: LogLevel

    /**
     Creates a PrintLoggerPlugin to log to the given severity
     - parameters:
        - level: The LogLevel to use
     */
    public init(level: LogLevel = .error) {
        self.logLevel = level
    }

    /**
     Applies itself to Player
     */
    public func apply<P>(player: P) where P: HeadlessPlayer {
        player.logger.logLevel = logLevel
        player.logger.hooks.prefixMessage.tap(name: pluginName) { .bail("[Player] [\($0.description)]: ") }

        let prefixedMessage = player.logger.hooks.prefixMessage.call(logLevel) ?? ""

        player.logger.hooks.trace.tap(name: pluginName, { print("\(prefixedMessage)\(($0))" ) })
        player.logger.hooks.debug.tap(name: pluginName, { print("\(prefixedMessage)\(($0))" ) })
        player.logger.hooks.info.tap(name: pluginName, { print("\(prefixedMessage)\(($0))" ) })
        player.logger.hooks.warn.tap(name: pluginName, { print("\(prefixedMessage)\(($0))" ) })
        player.logger.hooks.error.tap(name: pluginName, { print("\(prefixedMessage)\(($0))", $1?.localizedDescription ?? "") })
    }
}


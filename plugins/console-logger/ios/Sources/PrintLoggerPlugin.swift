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
    
    private func printMessage(level: LogLevel, items: [Any]) {
        let message = items.compactMap { $0 }.map { "\($0)" }.joined()
        print("[Player] [\(level.description)]: \(message)")
    }

    /**
     Applies itself to Player
     */
    public func apply<P>(player: P) where P: HeadlessPlayer {
        player.logger.logLevel = logLevel

        player.logger.hooks.trace.tap(name: pluginName, { self.printMessage(level: .trace, items: $0) })
        player.logger.hooks.debug.tap(name: pluginName, { self.printMessage(level: .debug, items: $0) })
        player.logger.hooks.info.tap(name: pluginName, { self.printMessage(level: .info, items: $0) })
        player.logger.hooks.warn.tap(name: pluginName, { self.printMessage(level: .warning, items: $0) })
        player.logger.hooks.error.tap(name: pluginName, {
            var items = $0.message ?? []
            if let err = $0.error {
                items += [err.localizedDescription]
            }
            self.printMessage(level: .error, items: items)
        })
    }
}

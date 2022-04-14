import JavaScriptCore
import SwiftHooks

/**
 A Logger that has hooks to tap into the lifecycle
 */
public class TapableLogger {
    /// The minimum level of messages to log
    public var logLevel: LogLevel = .error

    /// Hooks to tap into the lifecycle
    public let hooks = LoggerHooks()

    /**
     Creates a new TapableLogger
     */
    public init() {
        hooks.convertJSValue.tap(name: "TapableLogger") {[weak self] value in
            guard let converted = self?.convertJSValue(value) else { return .skip }
            return .bail(converted)
        }
    }

    /**
     Logs a `trace` level message
     - parameters:
        - message: The message to log
     */
    public func t(_ message: @autoclosure () -> String) {
        log(level: .trace, message: message())
    }

    /**
     Logs a `debug` level message
     - parameters:
        - message: The message to log
     */
    public func d(_ message: @autoclosure () -> String) {
        log(level: .debug, message: message())
    }

    /**
     Logs an`info` level message
     - parameters:
        - message: The message to log
     */
    public func i(_ message: @autoclosure () -> String) {
        log(level: .info, message: message())
    }

    /**
     Logs a `warning` level message
     - parameters:
        - message: The message to log
     */
    public func w(_ message: @autoclosure () -> String) {
        log(level: .warning, message: message())
    }

    /**
     Logs an `error` level message
     - parameters:
        - message: The message to log
     */
    public func e(_ message: @autoclosure () -> String) {
        log(level: .error, message: message())
    }

    /**
     Logs an `error` level message
     - parameters:
        - message: The message to log
        - error: An associated error object
     */
    public func e(_ message: @autoclosure () -> String, _ error: Error) {
        guard LogLevel.error.shouldLog(currentLevel: logLevel) else { return }
        hooks.error.call((message(), error))
    }

    /**
     Logs an `error` level message
     - parameters:
        - error: An error object to log
     */
    public func e(_ error: Error) {
        guard LogLevel.error.shouldLog(currentLevel: logLevel) else { return }
        hooks.error.call((nil, error))
    }

    /// Function signature for log messages from the JS layer
    public typealias JSLogFunction = @convention(block) (JSValue) -> Void

    /**
     Creates a log function that can be used in JavaScriptCore
     - parameters:
        - level: The log level to create the function for
     - returns: A `JSLogFunction` to be used in JavaScriptCore
     */
    internal func getJSLogFor(level: LogLevel) -> JSLogFunction {
        let logFn: JSLogFunction = { val in
            guard let message = self.hooks.convertJSValue.call(val) else { return }
            self.log(level: level, message: message)
        }

        return logFn
    }

    /**
     Logs a message with at the given log level
     - parameters:
        - level: The level to log the message as
        - message: The message to log
     */
    internal func log(level: LogLevel, message: @autoclosure () -> String) {
        guard level.shouldLog(currentLevel: logLevel) else { return }
        // use a computed var here because `hooks.nnn.call` takes an autoclosure
        // and may not actually want this string to be built
        var prefixedMessage: String { "\(hooks.prefixMessage.call(level) ?? "")\(message())" }
        switch level {
        case .trace: hooks.trace.call(prefixedMessage)
        case .debug: hooks.debug.call(prefixedMessage)
        case .info: hooks.info.call(prefixedMessage)
        case .warning: hooks.warn.call(prefixedMessage)
        case .error: hooks.error.call((prefixedMessage, nil))
        }
    }

    /**
     A default implementation to use for converting `JSValue` to string when logging from JavaScriptCore
     - parameters:
        - value: The JSValue to convert
     - returns: A String if it can be converted
     */
    internal func convertJSValue(_ value: JSValue) -> String? {
        guard
            !value.isUndefined
        else { return nil }
        return value.context.objectForKeyedSubscript("JSON")?.invokeMethod("stringify", withArguments: [value])?.toString()
    }
}

public extension TapableLogger {
    ///  Taps all log levels with the supplied callback.
    func tapLogs(name: String = "alllogs", callback: @escaping (String) -> Void) {
        let formatter = DateFormatter.logging
        hooks.prefixMessage.tap(name: name) { level in .bail("[\(formatter.string(from: Date())) \(level)] ") }
        hooks.trace.tap(name: name, callback)
        hooks.debug.tap(name: name, callback)
        hooks.info.tap(name: name, callback)
        hooks.warn.tap(name: name, callback)
        hooks.error.tap(name: name, { (err) in
            guard let msg = err.error.map({ "\(err.message ?? "error:") \($0.localizedDescription)" }) ?? err.message else {
                assert(false, "nothing to log?")
                return
            }
            callback(msg)
        })
    }
}

private extension DateFormatter {
    static let logging: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss.SSS"
        return formatter
    }()
}
/**
 Hooks to allow tapping into logger lifecycle
 */
public class LoggerHooks {
    public typealias ErrorMessage = (message: String?, error: Error?)
    /// Called for trace level messages
    public let trace = SyncHook<String>()
    /// Called for debug level messages
    public let debug = SyncHook<String>()
    /// Called for info level messages
    public let info = SyncHook<String>()
    /// Called for warning level messages
    public let warn = SyncHook<String>()
    /// Called for error level messages
    public let error = SyncHook<ErrorMessage>()

    /// Called to convert a JSValue from the core player into a string before logging
    public let convertJSValue = SyncBailHook<JSValue, String>()

    /// Called to get a logging prefix for a given log level for a log message
    public let prefixMessage = SyncBailHook<LogLevel, String>()
}

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
        hooks.convertJSValue.tap(name: "TapableLogger") { [weak self] value in
            guard let converted = self?.convertJSValue(value) else { return .skip }
            return .bail(converted)
        }
    }

    /**
     Logs a `trace` level message
     - parameters:
        - message: The message(s) to log
     */
    public func t(_ messages: Any...) {
        log(level: .trace, messages: messages)
    }

    /**
     Logs a `debug` level message
     - parameters:
        - message: The message(s) to log
     */
    public func d(_ messages: Any...) {
        log(level: .debug, messages: messages)
    }

    /**
     Logs an `info` level message
     - parameters:
        - message: The message(s) to log
     */
    public func i(_ messages: Any...) {
        log(level: .info, messages: messages)
    }

    /**
     Logs a `warning` level message
     - parameters:
        - message: The message(s) to log
     */
    public func w(_ messages: Any...) {
        log(level: .warning, messages: messages)
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

    /**
     Logs an `error` level message
     - parameters:
     - message: The message(s) to log
     - error: An associated error object
     */
    public func e(_ messages: Any..., er error: Error? = nil) {
        guard LogLevel.error.shouldLog(currentLevel: logLevel) else { return }
        if let error = error {
            hooks.error.call((messages, error))
        } else {
            hooks.error.call((messages, nil))
        }
    }

    /**
     Logs an `error` level message
     - parameters:
     - message: The message(s) to log
     */
    public func e(_ messages: Any...) {
        log(level: .error, messages: messages)
    }

    /// Function signature for log messages from the JS layer
    public typealias JSLogFunction = @convention(block) (JSValue) -> Void

    /**
     Creates a log function that can be used in JavaScriptCore
     - parameters:
        - level: The log level to create the function for
     - returns: A `JSLogFunction` to be used in JavaScriptCore
     */
    public func getJSLogFor(level: LogLevel, _ context: JSContext) -> JSValue {

        // function generator that takes varadic parameters and forwards the arguments into an array
        guard let restWrapper = context.evaluateScript("(fn) => (...args) => fn(args)") else {
            return JSValue()
        }

        let logFn: JSLogFunction = { [weak self] val in
            guard let message = self?.hooks.convertJSValue.call(val) else { return }
            self?.log(level: level, messages: message)
        }

        // converts Obj-c object to JSValue
        let jsCallback = JSValue(object: logFn, in: context)

        return restWrapper.call(withArguments: [jsCallback as Any])
    }


    internal func log(level: LogLevel, messages: [Any]) {
        guard level.shouldLog(currentLevel: logLevel) else { return }

        switch level {
        case .trace: hooks.trace.call(messages)
        case .debug: hooks.debug.call(messages)
        case .info: hooks.info.call(messages)
        case .warning: hooks.warn.call(messages)
        case .error: hooks.error.call((messages, nil))
        }
    }

    // other methods remain unchanged
    /**
     A default implementation to use for converting `JSValue` to `[Any]` when logging from JavaScriptCore
     - parameters:
        - value: The JSValue to convert
     - returns: An array of Any
     */
    internal func convertJSValue(_ value: JSValue) -> [Any]? {
        guard
            !value.isUndefined
        else { return nil }

        // return as aAray if JSValue can be converted to array otherwise return object in an Array
        return value.isArray ? value.toArray() : [value.toObject() as Any]
    }
}

/**
 Hooks to allow tapping into logger lifecycle
 */
public class LoggerHooks {
    public typealias ErrorMessage = (message: [Any]?, error: Error?)

    /// Called for trace level messages
    public let trace = SyncHook<[Any]>()

    /// Called for debug level messages
    public let debug = SyncHook<[Any]>()

    /// Called for info level messages
    public let info = SyncHook<[Any]>()

    /// Called for warning level messages
    public let warn = SyncHook<[Any]>()

    /// Called for error level messages
    public let error = SyncHook<ErrorMessage>()

    /// Called to convert a JSValue from the core player into `[Any]` before logging
    public let convertJSValue = SyncBailHook<JSValue, [Any]>()
}

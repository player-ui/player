//
//  WrappedFunction.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/2/21.
//

import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
    import PlayerUI
#endif

/// Represents a JS Function that was part of the asset in the JS runtime
public struct WrappedFunction<T>: JSValueBacked, Decodable, Hashable {
    public let rawValue: JSValue?

    public let userInfo: [CodingUserInfoKey: Any]?

    public init(rawValue: JSValue?, userInfo: [CodingUserInfoKey: Any]? = nil) {
        self.rawValue = rawValue
        self.userInfo = userInfo
    }

    /// Constructs a WrappedFunction from a decoder
    /// Since we can't decode JS functions using the JSONDecoder, this does nothing
    /// and the JSValue is populated later with reflection
    public init(from decoder: Decoder) throws {
        try self.init(rawValue: decoder.getJSValue(), userInfo: decoder.userInfo)
    }

    public func hash(into hasher: inout Hasher) {
        hasher.combine(rawValue)
    }

    /// In Swift 5.2 we can just call the entire object
    /// Executes the function
    public func callAsFunction(_ args: Any...) -> T? {
        guard let jsValue = rawValue else { return nil }
        let val = jsValue.call(withArguments: args)
        return val?.toObject() as? T
    }

    /// Executes the function and returns the customType specified
    public func callAsFunction<U: Decodable>(customType: U.Type, args: Any...) throws -> U? {
        guard let jsValue = rawValue else { throw DecodingError.malformedData }
        return try JSONDecoder().decode(customType, from: jsValue.call(withArguments: args))
    }

    public static func == (lhs: WrappedFunction<T>, rhs: WrappedFunction<T>) -> Bool {
        lhs.rawValue == rhs.rawValue
    }
}

public extension WrappedFunction where T: Decodable {
    enum Error: Swift.Error, Equatable {
        /// There was a failure in the promise from calling a JS function
        case promiseFailed(error: String)
    }

    func callAsFunctionAsync(args: Any...) async throws -> T {
        try await withCheckedThrowingContinuation { continuation in
            guard let jsValue = rawValue
            else { return continuation.resume(throwing: DecodingError.malformedData) }

            let promiseHandler: @convention(block) (JSValue) -> Void = {
                do {
                    let value = try JSONDecoder().decode(T.self, from: $0)
                    continuation.resume(returning: value)
                } catch {
                    continuation.resume(throwing: error)
                }
            }

            let errorHandler: @convention(block) (JSValue) -> Void = { error in
                continuation
                    .resume(throwing: WrappedFunction.Error.promiseFailed(error: error.toString()))
            }

            guard
                let context = jsValue.context,
                let callback = JSValue(object: promiseHandler, in: context),
                let catchCallback = JSValue(object: errorHandler, in: context)
            else {
                return continuation.resume(throwing: PlayerError.jsConversionFailure)
            }

            jsValue.call(withArguments: args)
                .invokeMethod("then", withArguments: [callback])
                .invokeMethod("catch", withArguments: [catchCallback])
        }
    }
}

/// Wrapper class to decode model references into strings from the raw JSValue
public struct ModelReference: JSValueBacked, Decodable, Hashable {
    public let rawValue: JSValue?

    /// The string value of this model reference
    public var stringValue: String? {
        rawValue?.toString()
    }

    public init(rawValue: JSValue?) {
        self.rawValue = rawValue
    }

    public init(from decoder: Decoder) throws {
        try self.init(rawValue: decoder.getJSValue())
    }
}

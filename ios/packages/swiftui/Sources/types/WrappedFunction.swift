//
//  WrappedFunction.swift
//  PlayerUI
//
//  Created by Harris Borawski on 3/2/21.
//

import Foundation
import JavaScriptCore

/**
 Represents a JS Function that was part of the asset in the JS runtime
 */
public struct WrappedFunction<T>: JSValueBacked, Decodable, Hashable {
    public let rawValue: JSValue?

    public init(rawValue: JSValue?) {
        self.rawValue = rawValue
    }

    /**
     Constructs a WrappedFunction from a decoder
     Since we can't decode JS functions using the JSONDecoder, this does nothing
     and the JSValue is populated later with reflection
     */
    public init(from decoder: Decoder) throws {
        self.init(rawValue: try decoder.getJSValue())
    }

    // In Swift 5.2 we can just call the entire object
    /**
     Executes the function
     */
    public func callAsFunction(_ args: Any...) -> T? {
        guard let jsValue = rawValue else { return nil }
        let val = jsValue.call(withArguments: args)
        return val?.toObject() as? T
    }
}

/**
 Wrapper class to decode model references into strings from the raw JSValue
 */
public struct ModelReference: JSValueBacked, Decodable, Hashable {
    public let rawValue: JSValue?

    public init(rawValue: JSValue?) {
        self.rawValue = rawValue
    }

    public init(from decoder: Decoder) throws {
        self.init(rawValue: try decoder.getJSValue())
    }

    /// The string value of this model reference
    public var stringValue: String? {
        rawValue?.toString()
    }
}

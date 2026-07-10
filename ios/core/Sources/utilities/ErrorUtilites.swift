//
//  ErrorUtilites.swift
//  PlayerUI
//
//  Created by bcallaghan  on 5/27/21.
//

import Foundation

public extension Error {
    /// Creates error descriptions logged by Player.
    var playerDescription: String {
        if let decodingError = self as? Swift.DecodingError {
            return decodingError.prettyDescription
        }
        return (self as CustomDebugStringConvertible).debugDescription
    }
}

extension Swift.DecodingError {
    /// Constructs a more human readable message to make it easier to identify and debug decoding
    /// errors
    var prettyDescription: String {
        let codingPathForDecodingErrorContext = { (context: Context) -> String in
            return context.codingPath
                .map(\.stringValue)
                .map {
                    let prefix = "Index "
                    if $0.hasPrefix(prefix) {
                        return "[\($0.dropFirst(prefix.count))]"
                    }
                    return $0
                }
                .joined(separator: ".")
                .replacingOccurrences(of: ".[", with: "[")
        }

        let messageForDecodingErrorContext = { (context: Context) -> String in
            let message = context.debugDescription
            let codingPath = codingPathForDecodingErrorContext(context)
            if !codingPath.isEmpty {
                return message + " (coding path \(codingPath))"
            }
            return message
        }

        switch self {
        case let .typeMismatch(_, context):
            return messageForDecodingErrorContext(context)
        case let .valueNotFound(_, context):
            return "Value not found at coding path \(codingPathForDecodingErrorContext(context))."
        case let .keyNotFound(key, context):
            var keyPath = codingPathForDecodingErrorContext(context)
            if !keyPath.isEmpty {
                keyPath.append(".")
            }
            keyPath.append(key.stringValue)
            return "Key not found at coding path \(keyPath)."
        case let .dataCorrupted(context):
            return messageForDecodingErrorContext(context)
        @unknown default:
            return "\(self)"
        }
    }
}

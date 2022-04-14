//
//  ErrorUtilites.swift
//  PlayerUI
//
//  Created by bcallaghan  on 5/27/21.
//

import Foundation

extension Error {

    /// Creates error descriptions logged by Player.
    var playerDescription: String {
        if let decodingError = self as? Swift.DecodingError {
            return decodingError.prettyDescription
        }
        return (self as CustomDebugStringConvertible).debugDescription
    }
}

extension Swift.DecodingError {

    /// Constructs a more human readable message to make it easier to identify and debug decoding errors
    var prettyDescription: String {

        let codingPathForDecodingErrorContext = { (context: Context) -> String in
            return context.codingPath
                .map {
                    $0.stringValue
                }
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
            if 0 < codingPath.count {
                return message + " (coding path \(codingPath))"
            }
            return message
        }

        switch self {
        case .typeMismatch(_, let context):
            return messageForDecodingErrorContext(context)
        case .valueNotFound(_, let context):
            return "Value not found at coding path \(codingPathForDecodingErrorContext(context))."
        case .keyNotFound(let key, let context):
            var keyPath = codingPathForDecodingErrorContext(context)
            if 0 < keyPath.count {
                keyPath.append(".")
            }
            keyPath.append(key.stringValue)
            return "Key not found at coding path \(keyPath)."
        case .dataCorrupted(let context):
            return messageForDecodingErrorContext(context)
        @unknown default:
            return "\(self)"
        }
    }
}

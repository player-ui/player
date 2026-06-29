//
//  StartOptions.swift
//  PlayerUI
//

import Foundation

/**
 Options forwarded to the core JS `Player.start(payload, options)` describing the
 incoming content's format. Mirrors the JS `StartOptions`/`ContentMeta` shape.

 The default format is `"player"`, meaning the payload is already a Player `Flow`
 and needs no conversion. Any other `format` is recognized by a plugin tapping the
 core `transformContent` hook (e.g. the A2UI plugin claims `"a2ui"`).
 */
public struct StartOptions {
    /// Content-format identifier. `nil`/`"player"` means the payload is already a `Flow`.
    public var format: String?

    /// Optional free-form content-format version (e.g. `"0.9"`). Plugins decide the convention.
    public var version: String?

    public init(format: String? = nil, version: String? = nil) {
        self.format = format
        self.version = version
    }

    /// Convenience for the A2UI snapshot format.
    public static let a2ui = StartOptions(format: "a2ui")

    /**
     Builds the JS options object, omitting `nil` keys. A Swift `[String: Any]`
     bridges to a plain JS object through JavaScriptCore when passed via
     `invokeMethod(_:withArguments:)`. Returns `nil` when nothing is set so the
     default `start(flow:)` code path stays byte-identical (no extra argument).
     */
    internal var jsValue: [String: Any]? {
        var dict: [String: Any] = [:]
        if let format = format { dict["format"] = format }
        if let version = version { dict["version"] = version }
        return dict.isEmpty ? nil : dict
    }
}

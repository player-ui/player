//
//  LogLevel.swift
//  PlayerUI
//
//  Created by Harris Borawski on 8/26/21.
//

import Foundation

/**
 The different levels of logging
 */
public enum LogLevel: Int, CustomStringConvertible, Comparable, CaseIterable {
    public static func < (lhs: LogLevel, rhs: LogLevel) -> Bool {
        lhs.rawValue < rhs.rawValue
    }

    /// Log all log statements
    case trace

    /// Log all debug and above statements
    case debug

    /// Log only info, warning or error
    case info

    /// Log only warning or error
    case warning

    /// Log only error
    case error

    public var description: String {
        switch self {
        case .trace:    return "trace"
        case .debug:    return "debug"
        case .info:     return " info"
        case .warning:  return " WARN"
        case .error:    return "ERROR"
        }
    }
}

extension LogLevel {
    /**
     Determines if a log message should proceed given the current log level
     - parameters:
        - currentLevel: The level to compare against to see if this instance should log
     - returns:
        Whether or not the message should log
     */
    func shouldLog(currentLevel: LogLevel) -> Bool { self >= currentLevel }
}

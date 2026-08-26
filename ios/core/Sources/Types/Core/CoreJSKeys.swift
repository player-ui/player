//
//  CoreJSKeys.swift
//  PlayerUI
//

import Foundation

/// Shared `objectForKeyedSubscript`/`setObject(_:forKeyedSubscript:)` key names used across the
/// Core flow/state/view JSValue wrappers (CompletedState, NavigationStates, Flow, FlowType,
/// PlayerView, ViewController, FlowController). Keys that are decoded in more than one of those
/// files share a single case here rather than being redeclared per file.
enum CoreJSKeys {
    static let flow = "flow"
    static let data = "data"
    static let view = "view"
    static let error = "error"
    static let id = "id"
    static let ref = "ref"
    static let exp = "exp"
    static let stateType = "state_type"
    static let currentState = "currentState"
    static let endState = "endState"
    static let controllers = "controllers"
    static let expression = "expression"
    static let transitions = "transitions"
    static let attributes = "attributes"
    static let outcome = "outcome"
    static let param = "param"
    static let isAwait = "await"
    static let status = "status"
    static let flowResult = "flowResult"
    static let logger = "logger"
    static let fail = "fail"
    static let name = "name"
    static let value = "value"
    static let initialView = "initialView"
    static let currentView = "currentView"
    static let current = "current"
    static let transition = "transition"
}

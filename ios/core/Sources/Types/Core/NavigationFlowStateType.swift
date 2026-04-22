import Foundation

/// All possible enumerations of navigation flow states.
///
/// Maps to the `state_type` field in the JSON flow definition (e.g. `"state_type": "VIEW"`).
/// Mirrors `NavigationFlowStateType` on the JVM/Android side.
public enum NavigationFlowStateType: Equatable {
    /// A state representing a renderable view (`"VIEW"`)
    case view
    /// An action state that executes an expression to determine the next transition (`"ACTION"`)
    case action
    /// An asynchronous variant of an action state (`"ASYNC_ACTION"`)
    case asyncAction
    /// A sub-flow state that delegates to another flow (`"FLOW"`)
    case flow
    /// An external state managed by the host application (`"EXTERNAL"`)
    case external
    /// A terminal state indicating the flow has completed (`"END"`)
    case end
    /// A state type not recognized by this version of the SDK.
    /// Preserves the original `state_type` string for forward-compatibility
    /// if new state types are added on the JS side.
    case unknown(String)

    /// Creates a `NavigationFlowStateType` from the raw `state_type` string in the flow JSON.
    /// Unrecognized values are captured as `.unknown(rawValue)` rather than discarded.
    public init(_ rawValue: String) {
        switch rawValue {
        case "VIEW": self = .view
        case "ACTION": self = .action
        case "ASYNC_ACTION": self = .asyncAction
        case "FLOW": self = .flow
        case "EXTERNAL": self = .external
        case "END": self = .end
        default:
            self = .unknown(rawValue)
        }
    }

    /// The raw `state_type` string as it appears in the flow JSON.
    public var rawValue: String {
        switch self {
        case .view: return "VIEW"
        case .action: return "ACTION"
        case .asyncAction: return "ASYNC_ACTION"
        case .flow: return "FLOW"
        case .external: return "EXTERNAL"
        case .end: return "END"
        case .unknown(let value): return value
        }
    }
}

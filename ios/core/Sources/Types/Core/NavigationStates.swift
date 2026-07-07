import Foundation
import JavaScriptCore

/// The base representation of a state within a Flow
open class NavigationBaseState: CreatedFromJSValue, JSValueProviding {
    /// A property to determine the type of state this is
    public let stateType: NavigationFlowStateType

    let rawValue: JSValue

    /// Backing JSValue for returning from waterfall hooks. Use when returning this state from a
    /// waterfall hook (e.g. beforeTransition).
    public var jsValue: JSValue {
        rawValue
    }

    public init(_ value: JSValue) {
        rawValue = value
        stateType = NavigationFlowStateType(value.objectForKeyedSubscript("state_type").toString())
    }

    public static func createInstance(value: JSValue) -> NavigationBaseState {
        let base = NavigationBaseState(value)
        switch base.stateType {
        case .view: return NavigationFlowViewState(value)
        case .action: return NavigationFlowActionState(value)
        case .asyncAction: return NavigationFlowAsyncActionState(value)
        case .flow: return NavigationFlowFlowState(value)
        case .external: return NavigationFlowExternalState(value)
        case .end: return NavigationFlowEndState(value)
        default: return base
        }
    }

    public typealias T = NavigationBaseState
}

/// A generic state that can transition to another state
open class NavigationFlowTransitionableState: NavigationBaseState {
    /// A mapping of transition-name to FlowState name
    public var transitions: [String: String]? {
        rawValue.objectForKeyedSubscript("transitions").toObject() as? [String: String]
    }
}

/// A state representing a view
@dynamicMemberLookup
public class NavigationFlowViewState: NavigationFlowTransitionableState {
    /// An id corresponding to a view from the 'views' array
    public var ref: String {
        rawValue.objectForKeyedSubscript("ref").toString()
    }

    /// View meta-properties
    public var attributes: [String: Any]? {
        rawValue.objectForKeyedSubscript("attributes").toObject() as? [String: Any]
    }

    public subscript<T>(dynamicMember member: String) -> T? {
        rawValue.objectForKeyedSubscript(member).toObject() as? T
    }
}

/// External Flow states represent states in the FSM that can't be resolved internally in the
/// player.
/// The flow will wait for the embedded application to manage moving to the next state via a
/// transition
@dynamicMemberLookup
public class NavigationFlowExternalState: NavigationFlowTransitionableState {
    /// A reference for this external state
    public var ref: String? {
        rawValue.objectForKeyedSubscript("ref").toString()
    }

    public subscript<T>(dynamicMember member: String) -> T? {
        rawValue.objectForKeyedSubscript(member).toObject() as? T
    }
}

/// An END state of the flow
@dynamicMemberLookup
public class NavigationFlowEndState: NavigationBaseState {
    /// A description of _how_ the flow ended.
    public var outcome: String {
        rawValue.objectForKeyedSubscript("outcome").toString()
    }

    public convenience init?(from value: JSValue?) {
        guard let value else { return nil }
        self.init(value)
    }

    public subscript<T>(dynamicMember member: String) -> T? {
        rawValue.objectForKeyedSubscript(member).toObject() as? T
    }
}

public extension NavigationFlowEndState {
    var param: [String: Any]? {
        rawValue.objectForKeyedSubscript("param").toObject() as? [String: Any]
    }
}

public class NavigationFlowFlowState: NavigationFlowTransitionableState {
    /// A reference to a FLOW id state to run
    public var ref: String {
        rawValue.objectForKeyedSubscript("ref").toString()
    }
}

/// Action states execute an expression to determine the next state to transition to
public class NavigationFlowActionState: NavigationFlowTransitionableState {
    /// An expression to execute. The return value determines the transition to take
    public var exp: Expression {
        if let multi = rawValue.objectForKeyedSubscript("exp").toObject() as? [String] {
            return .multi(exp: multi)
        } else {
            return .single(exp: rawValue.objectForKeyedSubscript("exp").toString())
        }
    }

    public enum Expression {
        case single(exp: String)
        case multi(exp: [String])
    }
}

/// Similar to NavigationFlowActionState, this state enabled the use of asynchronous expressions
public class NavigationFlowAsyncActionState: NavigationFlowTransitionableState {
    /// An expression to execute. The return value determines the transition to take
    public var exp: Expression {
        if let multi = rawValue.objectForKeyedSubscript("exp").toObject() as? [String] {
            return .multi(exp: multi)
        } else {
            return .single(exp: rawValue.objectForKeyedSubscript("exp").toString())
        }
    }

    public var await: Bool {
        rawValue.objectForKeyedSubscript("await").toBool()
    }

    public enum Expression {
        case single(exp: String)
        case multi(exp: [String])
    }
}

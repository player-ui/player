//
//  CompletedState.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 6/10/20.
//

import Foundation
import JavaScriptCore

/**
 Object for access to the controllers during a flow
 */
public class PlayerControllers {
    private let rawValue: JSValue

    /// The DataController for the current flow
    public let data: DataController

    /// The FlowController for the current flow
    public let flow: FlowController

    /// The ViewController for the current flow
    public let view: ViewController

    /// The ExpressionEvaluator for the current flow
    public let expression: ExpressionEvaluator

    public init?(from value: JSValue?) {
        guard let controllers = value else { return nil }
        rawValue = controllers
        data = DataController.createInstance(value: rawValue.objectForKeyedSubscript("data"))
        flow = FlowController.createInstance(value: rawValue.objectForKeyedSubscript("flow"))
        view = ViewController.createInstance(value: rawValue.objectForKeyedSubscript("view"))
        expression = ExpressionEvaluator.createInstance(value: rawValue.objectForKeyedSubscript("expression"))
    }
}

/**
 Enum with the different possible states of the player
 */
public enum PlayerFlowStatus: String {
    /// The Flow has not been started
    case notStarted = "not-started"

    /// The Flow has been started but not completed
    case inProgress = "in-progress"

    /// The Flow has ended
    case completed

    /// The flow encountered an error
    case error
}

/**
 Common properties for all flow states
 */
open class BaseFlowState {
    /// The status of the state
    var status: PlayerFlowStatus

    /**
     Creates a BaseFlowState
     - parameters:
        - status: The status of this state
     */
    public init(status: PlayerFlowStatus) {
        self.status = status
    }
}

extension BaseFlowState: CreatedFromJSValue {
    /// Typealias for CreatedFromJSValue protocol
    public typealias T = BaseFlowState

    /**
     Creates the appropriate state from the given `JSValue`
     - parameters:
        - value: The JSValue to construct the state from
     */
    public static func createInstance(value: JSValue) -> BaseFlowState {
        guard
            let rawStatus = value.objectForKeyedSubscript("status")?.toString(),
            let status = PlayerFlowStatus(rawValue: rawStatus),
            let state = {() -> BaseFlowState? in
                switch status {
                case .notStarted:
                    return NotStartedState.createInstance(from: value)
                case .inProgress:
                    return InProgressState.createInstance(from: value)
                case .completed:
                    return CompletedState.createInstance(from: value)
                case .error:
                    return ErrorState.createInstance(from: value)
                }
            }()
        else { return NotStartedState() }
        return state
    }
}

/**
 Common properties for States that contain Player Flow Data
 */
public protocol PlayerFlowExecutionData {
    /// The flow associated with this execution
    var flow: Flow { get }
}

public typealias EndState = NavigationFlowEndState

/**
 A structure that holds the data of a completed Fuego Flow
 */
public class CompletedState: BaseFlowState, PlayerFlowExecutionData {
    /// The flow object for the completed state
    public var flow: Flow

    /// The result of the flow
    public var endState: NavigationFlowEndState?

    /// The local data from the flow
    public var data: [String: Any]

    /**
     Create an instance of `CompletedState` from a JSValue
     - parameters:
        -  value: The JSValue representing the CompletedState
     - returns: A CompletedState object if the JSValue was one
     */
    public static func createInstance(from value: JSValue?) -> CompletedState? {
        guard
            let flow = value?.objectForKeyedSubscript("flow")
        else { return nil }
        return CompletedState(
            flow: Flow.createInstance(value: flow),
            endState: value.map { NavigationFlowEndState($0.objectForKeyedSubscript("endState")) },
            data: value?.objectForKeyedSubscript("data")?.toObject() as? [String: Any] ?? [:]
        )
    }

    private init(flow: Flow, endState: NavigationFlowEndState?, data: [String: Any]) {
        self.flow = flow
        self.endState = endState
        self.data = data
        super.init(status: .completed)
    }
}

/**
 A structure that holds the data of a Fuego Flow that hasnt been started
 */
public class NotStartedState: BaseFlowState {
    /**
    Create an instance of `NotStartedState` from a JSValue
    - parameters:
       -  value: The JSValue representing the NotStartedState
    - returns: A NotStartedState object if the JSValue was one
    */
    public static func createInstance(from value: JSValue?) -> NotStartedState? {
        return NotStartedState()
    }

    init() {
        super.init(status: .notStarted)
    }
}

/**
 A structure that holds the data of a Fuego Flow that is in progress
 */
public class InProgressState: BaseFlowState, PlayerFlowExecutionData {
    /// The flow object that is currently in progress
    public var flow: Flow

    /// A promise that resolves when the flow completes
    public var flowResult: NavigationFlowEndState?

    /// Controllers for the active state
    public var controllers: PlayerControllers?

    /// The Logger for the current player instance
    public let logger: JSLogger?

    /// A function to force the player to a failed state
    public let fail: (PlayerError) -> Void

    /**
    Create an instance of `InProgressState` from a JSValue
    - parameters:
       -  value: The JSValue representing the InProgressState
    - returns: A InProgressState object if the JSValue was one
    */
    public static func createInstance(from value: JSValue?) -> InProgressState? {
        guard
            let flow = value?.objectForKeyedSubscript("flow")
        else { return nil }
        return InProgressState(
            flow: Flow.createInstance(value: flow),
            flowResult: value.map { NavigationFlowEndState($0.objectForKeyedSubscript("flowResult")) },
            controllers: PlayerControllers(from: value?.objectForKeyedSubscript("controllers")),
            logger: JSLogger(from: value?.objectForKeyedSubscript("logger")),
            fail: { value?.objectForKeyedSubscript("fail")?.call(withArguments: [value?.context.error(for: $0) as Any]) }
        )
    }

    private init(
        flow: Flow,
        flowResult: NavigationFlowEndState?,
        controllers: PlayerControllers?,
        logger: JSLogger?,
        fail: @escaping (PlayerError) -> Void
    ) {
        self.flow = flow
        self.flowResult = flowResult
        self.controllers = controllers
        self.logger = logger
        self.fail = fail
        super.init(status: .inProgress)
    }
}

/**
A structure that holds the data of a Fuego Flow that has errored
*/
public class ErrorState: BaseFlowState, PlayerFlowExecutionData {
    /// The flow object that is currently in progress
    public var flow: Flow

    /// The error message
    public var error: String

    /**
    Create an instance of `ErrorState` from a JSValue
    - parameters:
       -  value: The JSValue representing the ErrorState
    - returns: A ErrorState object if the JSValue was one
    */
    public static func createInstance(from value: JSValue?) -> ErrorState? {
        guard
            let flow = value?.objectForKeyedSubscript("flow"),
            let message = value?.objectForKeyedSubscript("error")?.objectForKeyedSubscript("message")?.toString()
        else { return nil }
        return ErrorState(flow: Flow.createInstance(value: flow), error: message)
    }

    private init(flow: Flow, error: String) {
        self.flow = flow
        self.error = error
        super.init(status: .error)
    }
}

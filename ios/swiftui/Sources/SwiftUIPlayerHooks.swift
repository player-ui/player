//
//  SwiftUIPlayerHooks.swift
//  PlayerUI
//

import JavaScriptCore
import PlayerUI
import SwiftHooks
import SwiftUI

/// Lifecycle hooks for `SwiftUIPlayer`
public struct SwiftUIPlayerHooks: CoreHooks {
    /// Fired when the FlowController changes
    public var flowController: Hook<FlowController>

    /// Fired when the ViewController changes
    public var viewController: Hook<ViewController>

    /// Fired when the DataController changes
    public var dataController: Hook<DataController>

    /// Fired when the ErrorController changes
    public var errorController: Hook<ErrorController>

    /// Fired when the state changes
    public var state: Hook<BaseFlowState>

    /// A hook to modify the view or add environment objects before it is rendered
    public var view: SyncWaterfallHook<AnyView>

    /// Provide Transition Animation information for transition views in the same flow
    public var transition: SyncBailHook<Void, PlayerViewTransition>

    /// Provides access to the current flow
    public var onStart: Hook<FlowType>

    /// Initialize hooks from reference to javascript core player
    public init(from player: JSValue) {
        flowController = Hook<FlowController>(baseValue: player, name: Self.flowControllerHookName)
        viewController = Hook<ViewController>(baseValue: player, name: Self.viewControllerHookName)
        dataController = Hook<DataController>(baseValue: player, name: Self.dataControllerHookName)
        errorController = Hook<ErrorController>(
            baseValue: player,
            name: Self.errorControllerHookName
        )
        state = Hook<BaseFlowState>(baseValue: player, name: Self.stateHookName)
        view = SyncWaterfallHook<AnyView>()
        transition = SyncBailHook<Void, PlayerViewTransition>()
        onStart = Hook<FlowType>(baseValue: player, name: Self.onStartHookName)
    }
}

extension InProgressState: @retroactive ObservableObject {}

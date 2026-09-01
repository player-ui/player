//
//  CoreHooksNames.swift
//  PlayerUI
//

import Foundation

public extension CoreHooks {
    /// Hook names shared by all `CoreHooks` conformers (`HeadlessHooks`, `TestHooks`,
    /// `SwiftUIPlayerHooks`)
    static var flowControllerHookName: String {
        "flowController"
    }

    static var viewControllerHookName: String {
        "viewController"
    }

    static var dataControllerHookName: String {
        "dataController"
    }

    static var errorControllerHookName: String {
        "errorController"
    }

    static var stateHookName: String {
        "state"
    }

    static var onStartHookName: String {
        "onStart"
    }
}

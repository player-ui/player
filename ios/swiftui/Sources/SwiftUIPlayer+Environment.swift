//
//  SwiftUIPlayer+Environment.swift
//  PlayerUI
//

import PlayerUI
import SwiftUI

/// EnvironmentKey for storing `InProgressState`
struct InProgressStateKey: EnvironmentKey {
    /// The default value for `@Environment(\.inProgressState)`
    static var defaultValue: InProgressState?
}

/// EnvironmentKey for storing `constantsController`
struct ConstantsControllerStateKey: EnvironmentKey {
    /// The default value for `@Environment(\.constantsController)`
    static var defaultValue: ConstantsController?
}

public extension EnvironmentValues {
    /// The `InProgressState` of Player if it is in progress, and in scope
    var inProgressState: InProgressState? {
        get { self[InProgressStateKey.self] }
        set { self[InProgressStateKey.self] = newValue }
    }

    /// The ConstantsController reference of Player
    var constantsController: ConstantsController? {
        get { self[ConstantsControllerStateKey.self] }
        set { self[ConstantsControllerStateKey.self] = newValue }
    }
}

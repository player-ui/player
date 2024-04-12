//
//  DataControllerHooks.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-04-08.
//

import Foundation
import JavaScriptCore

/**
Hooks that can be tapped into for the DataController
This lets users tap into events in the JS environment
*/
public struct DataControllerHooks {
    /// Fired when the data changes
    public var onUpdate: HookDecode<[Update]>
}

public struct Update: Decodable {
    /** The updated binding */
    var binding: BindingInstance
    /** The old value */
    var oldValue: AnyType
    /** The new value */
    var newValue: AnyType
    /** Force the Update to be included even if no data changed */
    var force: Bool?
}

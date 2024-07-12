//
//  ViewHooks.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
Hooks that can be tapped into for the View
This lets users tap into events in the JS environment
*/
public struct ViewHooks {
    /// Fired when the view updates
    public var onUpdate: Hook<JSValue>
}

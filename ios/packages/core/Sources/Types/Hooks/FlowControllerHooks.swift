//
//  FlowControllerHooks.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
 Hooks that can be tapped into for the FlowController
 This lets users tap into events in the JS environment
 */
public struct FlowControllerHooks {
    /// Fired when the FlowController does a transition
    var transition: Hook<Flow>
}

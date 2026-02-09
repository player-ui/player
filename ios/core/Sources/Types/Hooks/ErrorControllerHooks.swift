//
//  ErrorControllerHooks.swift
//  PlayerUI
//
//  Created by Player Team
//

import Foundation
import JavaScriptCore

/**
 Hooks that can be tapped into for the ErrorController
 This lets users tap into error events in the JS environment
 */
public struct ErrorControllerHooks {
    /**
     Fired when any error is captured
     - The callback receives a PlayerErrorInfo object
     - Return true from the callback to bail and prevent error state navigation
     - Return nil/false to allow automatic navigation to continue
     */
    public var onError: BailHook<PlayerErrorInfo>
}


//
//  ViewControllerHooks.swift
//  
//
//  Created by Borawski, Harris on 2/12/20.
//

import Foundation
import JavaScriptCore

/**
Hooks that can be tapped into for the ViewController
This lets users tap into events in the JS environment
*/
public struct ViewControllerHooks {
    /// Fired when the view changes
    public var view: Hook<PlayerView>
}

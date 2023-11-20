//
//  ExternalActionPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 8/12/20.
//

import Foundation
import JavaScriptCore

/**
 This plugin is for registering a handler for EXTERNAL states
 */
public class ExternalActionPlugin: JSBasePlugin, NativePlugin {
    /**
     The handler function to run when an external state is transitioned to
     - parameters:
        - state: The state object that represents the external state
        - options: An object containing the dataModel instance and evaluate function
        - transition: A completion handler that takes a string to transition with
     */
    public typealias ExternalStateHandler = (NavigationFlowExternalState, PlayerControllers, @escaping (String) -> Void) throws -> Void

    private var handler: ExternalStateHandler?

    /**
     Construct a plugin to handle external states
     - parameters:
        - handler: the function to call when an external state is transitioned to
     */
    public convenience init(handler: @escaping ExternalStateHandler) {
        self.init(
            fileName: "external-action-plugin.prod",
            pluginName: "ExternalActionPlugin.ExternalActionPlugin"
        )
        self.handler = handler
    }

    /**
     Retrieves the arguments for constructing this plugin, this is necessary because the arguments need to be supplied after
     construction of the swift object, once the context has been provided
     - returns: An array of arguments to construct the plugin
     */
    override public func getArguments() -> [Any] {
            let callback: @convention(block) (JSValue, JSValue) -> JSValue? = { [weak self] (state, options) in
                guard
                    let context = self?.context,
                    let controllers = PlayerControllers(from: options),
                    let promise = JSUtilities.createPromise(context: context, handler: { (resolve, reject) in
                        do {
                            try self?.handler?(NavigationFlowExternalState(state), controllers) { transition in
                                resolve(transition)
                            }
                        } catch {
                            reject(JSValue(newErrorFromMessage: error.playerDescription, in: context) as Any)
                        }
                    })
                else { return nil }
                return promise
            }
            let jsCallback = JSValue(object: callback, in: context) as Any
            return [jsCallback]
        }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: ExternalActionPlugin.self), pathComponent: "ExternalActionPlugin.bundle")
    }
}

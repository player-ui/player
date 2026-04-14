//
//  ExternalStatePlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 8/12/20.
//

import Foundation
import JavaScriptCore

import PlayerUI

public struct ExternalStateHandler {
    /// Map of properties to match against external states.
    /// Must include "ref" key.
    public typealias Match = [String: Any]

    /**
     The handler function to run when an external state is transitioned to
     - parameters:
        - state: The state object that represents the external state
        - options: An object containing the dataModel instance and evaluate function
        - transition: A completion handler that takes a string to transition with.
            This completion handler lets the user transition at an appropriate time.
     */
    public typealias Function = (
        NavigationFlowExternalState,
        PlayerControllers,
        @escaping (String) -> Void
    ) throws -> Void

    public let ref: String
    public let match: Match?
    public let handlerFunction: Function

    public init(ref: String, match: Match? = nil, handlerFunction: @escaping Function) {
        self.ref = ref
        self.match = match
        self.handlerFunction = handlerFunction
    }
}

/**
 This plugin is for registering a handler for EXTERNAL states
 */
public class ExternalStatePlugin: JSBasePlugin, NativePlugin {
    private var handlers: [ExternalStateHandler]

    /**
     Construct a plugin to handle external states. Every match/key must include a `ref`.
     - parameters:
        - handlers: array of handlers with matchers and handler functions.
     */
    public init(handlers: [ExternalStateHandler]) {
        self.handlers = handlers
        super.init(
            fileName: "ExternalStatePlugin.native",
            pluginName: "ExternalStatePlugin.ExternalStatePlugin"
        )
    }

    /**
     Retrieves the arguments for constructing this plugin.
     This is necessary because the arguments need to be supplied after construction of the swift object,
     once the context has been provided.
     - returns: An array of arguments to construct the plugin
     */
    override public func getArguments() -> [Any] {
        guard let context = context else { return [] }

        let jsHandlers = handlers.map { matchedHandler -> JSValue? in
            let callback: @convention(block) (JSValue, JSValue) -> JSValue? = { [weak self] (state, options) in
                guard
                    let context = self?.context,
                    let controllers = PlayerControllers(from: options),
                    let promise = JSUtilities.createPromise(context: context, handler: { (resolve, reject) in
                        do {
                            try matchedHandler.handlerFunction(NavigationFlowExternalState(state), controllers) { transition in
                                resolve(transition)
                            }
                        } catch {
                            reject(JSValue(newErrorFromMessage: error.playerDescription, in: context) as Any)
                        }
                    })
                else { return nil }
                return promise
            }

            return JSValue(object: [
                "ref": matchedHandler.ref,
                "match": matchedHandler.match,
                "handlerFunction": JSValue(object: callback, in: context) as Any
            ], in: context)
        }

        return [jsHandlers]
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
    }

    public static let bundle = Bundle.module
}

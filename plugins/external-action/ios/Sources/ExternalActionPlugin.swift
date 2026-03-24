//
//  ExternalActionPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 8/12/20.
//

import Foundation
import JavaScriptCore

import PlayerUI

public enum ExternalActionPluginError: LocalizedError {
    case matchMissingRef(match: [String: Any])

    public var errorDescription: String? {
        switch self {
        case .matchMissingRef(let match):
            return "The key/match (\(match)) must contain a 'ref' key."
        }
    }
}

public struct ExternalActionHandler {
    public typealias Match = [String: Any]

    /**
     The handler function to run when an external state is transitioned to
     - parameters:
        - state: The state object that represents the external state
        - options: An object containing the dataModel instance and evaluate function
        - transition: A completion handler that takes a string to transition with.
            This completion handler lets the user transition at an appropriate time.
     */
    public typealias Handler = (
        NavigationFlowExternalState,
        PlayerControllers,
        @escaping (String) -> Void
    ) throws -> Void

    public let match: Match
    public let handler: Handler

    public init(match: Match, handler: @escaping Handler) {
        self.match = match
        self.handler = handler
    }
}

/**
 This plugin is for registering a handler for EXTERNAL states
 */
public class ExternalActionPlugin: JSBasePlugin, NativePlugin {
    private var handlers: [ExternalActionHandler]

    /**
     Construct a plugin to handle external states. Every match/key must include a `ref`.
     - parameters:
        - handlers: array of handlers with matchers and handler functions.
     */
    public init(handlers: [ExternalActionHandler]) throws {
        try handlers.forEach { handler in
            let match = handler.match
            if match["ref"] == nil {
                throw ExternalActionPluginError.matchMissingRef(match: match)
            }
        }
        self.handlers = handlers
        super.init(
            fileName: "ExternalActionPlugin.native",
            pluginName: "ExternalActionPlugin.ExternalActionPlugin"
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

        let jsHandlers = handlers.map { matchedHandler in
            let callback: @convention(block) (JSValue, JSValue) -> JSValue? = { [weak self] (state, options) in
                guard
                    let context = self?.context,
                    let controllers = PlayerControllers(from: options),
                    let promise = JSUtilities.createPromise(context: context, handler: { (resolve, reject) in
                        do {
                            try matchedHandler.handler(NavigationFlowExternalState(state), controllers) { transition in
                                resolve(transition)
                            }
                        } catch {
                            reject(JSValue(newErrorFromMessage: error.playerDescription, in: context) as Any)
                        }
                    })
                else { return nil }
                return promise
            }

            let jsMatch = JSValue(object: matchedHandler.match, in: context)
            let jsCallback = JSValue(object: callback, in: context)
            return [jsMatch, jsCallback]
        }

        return [jsHandlers]
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
    }

    public static let bundle = Bundle.module
}

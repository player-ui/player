//
//  ExpressionPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 6/10/20.
//

import Foundation
import JavaScriptCore

/**
 Plugin for registering custom expressions with Player
 */
public class ExpressionPlugin: JSBasePlugin, NativePlugin {
    private var expressions: [String: ([Any]) -> Any?] = [:]
    /**
     Constructs the ExpressionPlugin
     Handler functions receive the positional arguments from the call in the content as an array
     - parameters:
        - expressions: A dictionary of expression name to handler function
     */
    public convenience init(expressions: [String: ([Any]) -> Any?] = [:]) {
        self.init(fileName: "expression-plugin.prod", pluginName: "ExpressionPlugin.ExpressionPlugin")
        self.expressions = expressions
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: ExpressionPlugin.self), pathComponent: "ExpressionPlugin.bundle")
    }

    override public func getArguments() -> [Any] {
        guard
            let map = context?.evaluateScript("Map")?.construct(withArguments: []),
            let restWrapper = context?.evaluateScript("(fn) => (context, ...args) => fn(context, args)"),
            let context = self.context
        else { return [] }
        for (key, value) in expressions {
            let callback: @convention(block) (JSValue?, JSValue?) -> JSValue? = { (_, params) in
                let args = params?.toObject() as? [Any] ?? []
                return JSValue(object: value(args), in: context)
            }
            let jsCallback = JSValue(object: callback, in: context)
            map.invokeMethod("set", withArguments: [key, restWrapper.call(withArguments: [jsCallback as Any]) as Any])
        }
        return [map]
    }
}

//
//  AsyncNodePlugin.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-02-05.
//

import Foundation
import JavaScriptCore
import PlayerUI

public typealias AsyncHookHandler = (JSValue, JSValue) async throws -> AsyncNodeHandlerType

public enum AsyncNodeHandlerType {
    case multiNode([ReplacementNode])
    case singleNode(ReplacementNode)
    case emptyNode
}

/**
 Wraps the core AsyncNodePlugin and taps into the `onAsyncNode` hook to allow asynchronous replacement of the node object that contains `async`
 */
public class AsyncNodePlugin: JSBasePlugin, NativePlugin {
    public var hooks: AsyncNodeHook?
    
    private var asyncHookHandler: AsyncHookHandler?
    
    public var plugins: [JSBasePlugin] = []
    
    /**
     Constructs the AsyncNodePlugin
     - Parameters:
     - handler: The callback that is used to tap into the core `onAsyncNode` hook
     exposed to users of the plugin allowing them to supply the replacement node used in the tap callback
     */
    public convenience init(plugins: [JSBasePlugin] = [AsyncNodePluginPlugin()], _ handler: @escaping AsyncHookHandler) {
        
        self.init(fileName: "AsyncNodePlugin.native", pluginName: "AsyncNodePlugin.AsyncNodePlugin")
        self.asyncHookHandler = handler
        self.plugins = plugins
    }
    
    /**
     Converts a given `ReplacementNode` to a `JSValue` that can be used in the JavaScript context.
     
     - Parameters:
     - replacementNode: The `ReplacementNode` to be converted.
     - context: The `JSContext` in which the `JSValue` will be used.
     - Returns: A `JSValue` representing the given `ReplacementNode`, or `nil` if the conversion fails.
     */
    func convertReplacementNodeToJSValue(_ replacementNode: ReplacementNode, context: JSContext) -> JSValue? {
        switch replacementNode {
        case .encodable(let encodable):
            let encoder = JSONEncoder()
            do {
                let res = try encoder.encode(encodable)
                return context.evaluateScript("(\(String(data: res, encoding: .utf8) ?? ""))") as JSValue
            } catch {
                return nil
            }
        case .concrete(let jsValue):
            return jsValue
        }
    }
    
    /**
     Converts a given `AsyncNodeHandlerType` to a `JSValue` that can be used in the JavaScript context.
     
     - Parameter replacementNode: The `AsyncNodeHandlerType` to be converted.
     - Returns: A `JSValue` representing the given `AsyncNodeHandlerType`, or `nil` if the conversion fails.
     */
    
    func replacementNodeToJSValue(_ replacementNode: AsyncNodeHandlerType) -> JSValue? {
        guard let context = context else {
            return JSValue()
        }
        switch replacementNode {
        case .multiNode(let replacementNodes):
            let jsValueArray = replacementNodes.compactMap { node in
                switch node {
                    
                case .encodable(let encodable):
                    return convertReplacementNodeToJSValue(.encodable(encodable), context: context)
                case .concrete(let jsValue):
                    return convertReplacementNodeToJSValue(.concrete(jsValue), context: context)
                    
                }
            }
            return context.objectForKeyedSubscript("Array").objectForKeyedSubscript("from").call(withArguments: [jsValueArray])
            
        case .singleNode(let replacementNode):
            switch replacementNode {
                
            case .encodable(let encodable):
                return convertReplacementNodeToJSValue(.encodable(encodable), context: context)
            case .concrete(let jsValue):
                return convertReplacementNodeToJSValue(.concrete(jsValue), context: context)
                
            }
            
        case .emptyNode:
            return nil
        }
    }
    
    override public func setup(context: JSContext) {
        super.setup(context: context)
        
        if let pluginRef = pluginRef {
            self.hooks = AsyncNodeHook(onAsyncNode: AsyncHook2(baseValue: pluginRef, name: "onAsyncNode"))
        }
        
        hooks?.onAsyncNode.tap({ node, callback in
            // hook value is the original node
            guard let asyncHookHandler = self.asyncHookHandler else {
                return JSValue()
            }
            
            let replacementNode = try await (asyncHookHandler)(node, callback)
            return self.replacementNodeToJSValue(replacementNode) ?? JSValue()
        })
    }
    
    /**
     Retrieves the arguments for constructing this plugin, this is necessary because the arguments need to be supplied after
     construction of the swift object, once the context has been provided
     - returns: An array of arguments to construct the plugin
     */
    override public func getArguments() -> [Any] {
        for plugin in plugins {
            plugin.context = self.context
        }
        
        return [["plugins": plugins.map { $0.pluginRef }]]
    }
    
    override open func getUrlForFile(fileName: String) -> URL? {
#if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
#else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: AsyncNodePlugin.self),
            pathComponent: "PlayerUIAsyncNodePlugin.bundle"
        )
#endif
    }
}

public struct AsyncNodeHook {
    public let onAsyncNode: AsyncHook2<JSValue, JSValue>
}

/**
 Replacement node that the callback of this plugin expects, users can supply either a JSValue or an Encodable object that gets converted to a JSValue in the `setup`
 */
public enum ReplacementNode: Encodable {
    case concrete(JSValue)
    case encodable(Encodable)
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch self {
        case .encodable(let value):
            try container.encode(value)
        case .concrete( _):
            break
        }
    }
}

public struct AssetPlaceholderNode: Encodable {
    public enum CodingKeys: String, CodingKey {
        case asset
    }
    
    var asset: Encodable
    public init(asset: Encodable) {
        self.asset = asset
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try? container.encode(asset, forKey: .asset)
    }
}

public struct AsyncNode: Codable, Equatable {
    var id: String
    var async: Bool = true
    
    public init(id: String) {
        self.id = id
    }
}

/**
 Wraps the core AsyncNodePlugins AsyncNodePluginPlugin, which has functionality that should be applied to each AsyncNodePluginPlugin passed in
 */
public class AsyncNodePluginPlugin: JSBasePlugin {
    public convenience init() {
        self.init(fileName: "AsyncNodePlugin.native", pluginName: "AsyncNodePlugin.AsyncNodePluginPlugin")
    }
    
    override open func getUrlForFile(fileName: String) -> URL? {
#if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
#else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: AsyncNodePluginPlugin.self),
            pathComponent: "PlayerUIAsyncNodePlugin.bundle"
        )
#endif
    }
}

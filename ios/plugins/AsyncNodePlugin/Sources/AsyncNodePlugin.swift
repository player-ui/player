//
//  AsyncNodePlugin.swift
//  PlayerUI
//
//  Created by Zhao Xia Wu on 2024-02-05.
//

import Foundation
import JavaScriptCore

public typealias AsyncHookHandler = (JSValue) async throws -> AsyncNodeHandlerType

public enum AsyncNodeHandlerType {
    case multiNode([ReplacementNode])
    case singleNode(ReplacementNode)
}

/**
 Wraps the core AsyncNodePlugin and taps into the `onAsyncNode` hook to allow asynchronous replacement of the node object that contains `async`
 */
public class AsyncNodePlugin: JSBasePlugin, NativePlugin {
    public var hooks: AsyncNodeHook?

    private var asyncHookHandler: AsyncHookHandler?

    /**
     Constructs the AsyncNodePlugin
     - Parameters:
        - handler: The callback that is used to tap into the core `onAsyncNode` hook
                   exposed to users of the plugin allowing them to supply the replacement node used in the tap callback
     */
    public convenience init(_ handler: @escaping AsyncHookHandler) {
        self.init(fileName: "async-node-plugin.prod", pluginName: "AsyncNodePlugin.AsyncNodePlugin")
        self.asyncHookHandler = handler
    }

    override public func setup(context: JSContext) {
        super.setup(context: context)

        if let pluginRef = self.pluginRef {
            self.hooks = AsyncNodeHook(onAsyncNode: AsyncHook(baseValue: pluginRef, name: "onAsyncNode"))
        }

        hooks?.onAsyncNode.tap({ node in
            // hook value is the original node
            guard let asyncHookHandler = self.asyncHookHandler else {
                return JSValue()
            }

            let replacementNode = try await (asyncHookHandler)(node)

            switch replacementNode {
            case .multiNode(let replacementNodes):
                let jsValueArray = replacementNodes.compactMap({ node in
                    switch node {
                    case .concrete(let jsValue):
                        return jsValue
                    case .encodable(let encodable):
                        let encoder = JSONEncoder()
                        do {
                            let res = try encoder.encode(encodable)
                            return context.evaluateScript("(\(String(data: res, encoding: .utf8) ?? ""))") as JSValue
                        } catch {
                            return nil
                        }
                    }
                })

                return context.objectForKeyedSubscript("Array").objectForKeyedSubscript("from").call(withArguments: [jsValueArray])

            case .singleNode(let replacementNode):
                switch replacementNode {

                case .encodable(let encodable):
                    let encoder = JSONEncoder()
                    do {
                        let res = try encoder.encode(encodable)
                        return context.evaluateScript("(\(String(data: res, encoding: .utf8) ?? ""))") as JSValue
                    } catch {
                        break
                    }
                case .concrete(let jsValue):
                    return jsValue
                }
            }

            return nil
        })
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: AsyncNodePlugin.self), pathComponent: "PlayerUI_AsyncNodePlugin.bundle")
    }
}

public struct AsyncNodeHook {
    public let onAsyncNode: AsyncHook<JSValue>
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

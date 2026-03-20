//
//  TinyPubSub.swift
//  PlayerUI
//

import Foundation
import JavaScriptCore

import PlayerUI

/**
 A handle to a JavaScript TinyPubSub instance that can be shared across multiple PubSubPlugin instances.

 Create with a `JSContext` for immediate use, or create without one and pass to a `PubSubPlugin`
 which will initialize it automatically during setup. Subscribe and publish calls made before the
 instance is initialized are silently ignored.

 ```swift
 // Standalone usage — provide a context at init:
 let sharedBus = TinyPubSub(context: someContext)

 // Plugin usage — the plugin initializes the shared bus for you:
 let sharedBus = TinyPubSub()
 let plugin1 = PubSubPlugin([], pubsub: sharedBus)
 let plugin2 = PubSubPlugin([], options: PubSubPluginOptions(expressionName: "customPublish"), pubsub: sharedBus)
 ```
 */
public class TinyPubSub {
    /// Reference to the underlying JS TinyPubSub instance. Set during initialization.
    internal var jsValue: JSValue?

    /**
     Creates a TinyPubSub instance and immediately constructs the underlying JS object
     in the given context.
     - parameters:
        - context: The JS context in which the TinyPubSub instance will live
     */
    public init(context: JSContext) {
        initialize(in: context)
    }

    /**
     Creates an uninitialized TinyPubSub handle. Pass this to a `PubSubPlugin` and it will
     initialize the underlying JS instance when the plugin is set up.
     */
    public init() {}

    /**
     Initializes the underlying JS TinyPubSub instance in the given context. Called automatically
     by `PubSubPlugin` during setup. Subsequent calls are no-ops.
     - parameters:
        - context: The JS context in which to create the TinyPubSub instance
     */
    internal func setup(context: JSContext) {
        guard jsValue == nil else { return }
        initialize(in: context)
    }

    private func initialize(in context: JSContext) {
        if let url = ResourceUtilities.urlForFile(name: "PubSubPlugin.native", ext: "js", bundle: Bundle.module),
           let jsString = try? String(contentsOf: url, encoding: .utf8) {
            context.evaluateScript(jsString)
        }
        jsValue = context.evaluateScript("new PubSubPlugin.TinyPubSub()")
    }

    /**
     Subscribe to an event on the shared bus.
     - parameters:
        - eventName: The name of the event to listen for
        - callback: Called with the event name and any associated data when the event fires
     - returns: A subscription token that can be passed to `unsubscribe` to cancel the subscription,
                or `nil` if the JS instance has not been set up yet.
     */
    @discardableResult
    public func subscribe(eventName: String, callback: @escaping (String, AnyType?) -> Void) -> String? {
        guard let ref = jsValue else { return nil }
        let block: @convention(block) (JSValue?, JSValue?) -> Void = { (event, data) in
            guard let name = event?.toString() else { return }
            if
                let isString = data?.isString, isString,
                let objectString = data?.toString()
            {
                callback(name, .string(data: objectString))
            } else if
                let object = data?.toObject(),
                let objectData = try? JSONSerialization.data(withJSONObject: object),
                let eventData = try? AnyTypeDecodingContext(rawData: objectData)
                    .inject(to: JSONDecoder())
                    .decode(AnyType.self, from: objectData)
            {
                callback(name, eventData)
            } else {
                callback(name, nil)
            }
        }
        let jsCallback = JSValue(object: block, in: ref.context) as Any
        return ref.invokeMethod("subscribe", withArguments: [eventName, jsCallback])?.toString()
    }

    /**
     Publish an event on the shared bus.
     - parameters:
        - eventName: The name of the event
        - eventData: Arbitrary data associated with the event
     */
    public func publish(eventName: String, eventData: AnyType) {
        guard
            let ref = jsValue,
            let data = try? JSONEncoder().encode(eventData),
            let dataString = String(data: data, encoding: .utf8),
            let dataObject = ref.context.evaluateScript("(\(dataString))")
        else { return }
        ref.invokeMethod("publish", withArguments: [eventName, dataObject])
    }

    /**
     Unsubscribe using a token returned from a previous `subscribe` call.
     - parameters:
        - token: The token returned by `subscribe`
     */
    public func unsubscribe(token: String) {
        jsValue?.invokeMethod("unsubscribe", withArguments: [token])
    }
}

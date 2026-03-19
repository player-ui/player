//
//  TinyPubSub.swift
//  PlayerUI
//

import Foundation
import JavaScriptCore

import PlayerUI

/**
 A handle to a JavaScript TinyPubSub instance that can be shared across multiple PubSubPlugin instances.

 Assign a `JSContext` to this object (or pass it to a `PubSubPlugin` which will do so automatically)
 to create the underlying JS TinyPubSub instance. Subscribe and publish calls made before a context
 is assigned are silently ignored.

 ```swift
 // Standalone usage — assign a context directly:
 let sharedBus = TinyPubSub()
 sharedBus.context = someContext   // creates the JS TinyPubSub immediately

 // Plugin usage — the plugin assigns the context for you:
 let sharedBus = TinyPubSub()
 let plugin1 = PubSubPlugin([], pubsub: sharedBus)
 let plugin2 = PubSubPlugin([], options: PubSubPluginOptions(expressionName: "customPublish"), pubsub: sharedBus)
 ```
 */
public class TinyPubSub {
    /// Reference to the underlying JS TinyPubSub instance. Populated once a context is assigned.
    internal var jsValue: JSValue?

    /**
     The JS context in which this TinyPubSub instance lives.
     Setting this property loads the PubSubPlugin native bundle (if not already loaded) and
     constructs the JS TinyPubSub instance. Subsequent assignments are ignored once the instance
     has been created.
     */
    public var context: JSContext? {
        didSet {
            guard let jsContext = context, jsValue == nil else { return }
            if let url = ResourceUtilities.urlForFile(name: "PubSubPlugin.native", ext: "js", bundle: Bundle.module),
               let jsString = try? String(contentsOf: url, encoding: .utf8) {
                jsContext.evaluateScript(jsString)
            }
            jsValue = jsContext.evaluateScript("new PubSubPlugin.TinyPubSub()")
        }
    }

    public init() {}

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

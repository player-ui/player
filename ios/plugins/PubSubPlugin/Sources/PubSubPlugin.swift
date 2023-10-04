//
//  PubsubPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 4/17/20.
//

import Foundation
import JavaScriptCore

/**
 Additional options for `PubSubPlugin`
 */
public struct PubSubPluginOptions: Codable {
    /// A custom expression name to register
    let expressionName: String?

    /**
     Constructs the options object
     - parameters:
        - expressionName: An optional name to use as the publish expression
     */
    public init(expressionName: String?) {
        self.expressionName = expressionName
    }
}

/**
 A plugin to register custom publish expressions and handlers
 */
public class PubSubPlugin: JSBasePlugin, NativePlugin {
    /// Array of subscriptions to subscribe once setup is complete
    private var eventSubscriptions: [PubSubSubscription] = []

    /// Additional options for the PubSubPlugin
    private var options: PubSubPluginOptions?

    /**
     Constructs a PubSubPlugin
     - parameters:
        - eventNames: The event names to subscribe to
        - eventReceived: A callback to receive events
     */
    public convenience init(_ subscriptions: [PubSubSubscription], options: PubSubPluginOptions? = nil) {
        self.init(fileName: "pubsub-plugin.prod", pluginName: "PubSubPlugin.PubSubPlugin")
        eventSubscriptions = subscriptions
        self.options = options
    }

    /**
    Constructs the PubSub Plugin in the given context
    - parameters:
       - context: The context to load the plugin into
    */
    override public func setup(context: JSContext) {
        super.setup(context: context)
        for subscription in eventSubscriptions {
            subscribe(eventName: subscription.0, callback: subscription.1)
        }
    }

    public override func getArguments() -> [Any] {
        guard let name = self.options?.expressionName else { return [] }
        return [["expressionName": name]]
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle(for: PubSubPlugin.self), pathComponent: "PubSubPlugin.bundle")
    }

    /**
     Subscribe to an event
     - parameters:
        - eventName: The name of the event to attach a handler to
        - callback: The handler to call when the event is received
     */
    private func subscribe(eventName: String, callback: @escaping (String, AnyType?) -> Void) {
        guard let pluginRef = pluginRef else { return }
        let callback: @convention(block) (JSValue?, JSValue?) -> Void = { (event, data) in
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
        let jsCallback = JSValue(object: callback, in: pluginRef.context) as Any
        pluginRef.invokeMethod("subscribe", withArguments: [eventName, jsCallback])
    }

    /**
     Publish an event through the plugin
     - parameters:
        - eventName: The name of the event
        - eventData: Arbitrary data associated with the event
     */
    public func publish(eventName: String, eventData: AnyType) {
        guard
            let data = try? JSONEncoder().encode(eventData),
            let dataString = String(data: data, encoding: .utf8),
            let dataObject = pluginRef?.context.evaluateScript("(\(dataString))")
        else { return }
        pluginRef?.invokeMethod("publish", withArguments: [eventName, dataObject])

    }
}

/// A subscription object for the PubSubPlugin
public typealias PubSubSubscription = (String, (String, AnyType?) -> Void)

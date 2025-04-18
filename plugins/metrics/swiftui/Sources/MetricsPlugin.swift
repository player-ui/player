//
//  MetricsPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 6/21/21.
//

import Foundation
import JavaScriptCore
import SwiftUI

#if SWIFT_PACKAGE
import PlayerUI
import PlayerUISwiftUI
#endif

/// A Plugin that provides request time data to `MetricsPlugin`
public class RequestTimePlugin: NativePlugin {
    public var pluginName: String = "RequestTime"
    private let requestTimeWebPlugin: RequestTimeWebPlugin

    /// Construct a `RequestTimePlugin`
    /// - Parameter getRequestTime: A callback to retrieve the time the last request took
    public init(_ getRequestTime: @escaping () -> Int) {
        self.requestTimeWebPlugin = RequestTimeWebPlugin(getRequestTime)
    }

    public func apply<P>(player: P) where P: HeadlessPlayer {
        requestTimeWebPlugin.context = player.jsPlayerReference?.context
        player.applyTo(MetricsPlugin.self) { [weak self] plugin in
            self?.requestTimeWebPlugin.pluginRef?.invokeMethod("apply", withArguments: [plugin])
        }
    }
}

class RequestTimeWebPlugin: JSBasePlugin {
    private var getRequestTime: () -> Int = { 0 }
    public convenience init(_ getRequestTime: @escaping () -> Int) {
        self.init(fileName: "MetricsPlugin.native", pluginName: "MetricsPlugin.RequestTimeWebPlugin")
        self.getRequestTime = getRequestTime
    }

    public override func getArguments() -> [Any] {
        let handler: @convention(block) () -> Int = {
            self.getRequestTime()
        }
        return [JSValue(object: handler, in: context) as Any]
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: MetricsPlugin.self),
            pathComponent: "PlayerUI_MetricsPlugin.bundle"
        )
        #endif
    }
}
/**
 Plugin for capturing metrics
 */
public class MetricsPlugin: JSBasePlugin, NativePlugin, WithSymbol {
    public static let symbol = "MetricsPlugin.MetricsCorePluginSymbol"
    public typealias RenderEndHandler = (MetricsTiming?, NodeRenderMetrics?, PlayerFlowMetrics?) -> Void
    private var trackRenderTime: Bool = true

    var onRenderEnd: RenderEndHandler?

    public var hooks: MetricsHooks?

    var onRenderEndJSHandler: @convention(block) (JSValue?, JSValue?, JSValue?) -> Void {
        { [weak self] timing, nodeMetrics, flowMetrics in
            let decoder = JSONDecoder()
            self?.onRenderEnd?(
                try? decoder.decode(MetricsTiming.self, from: timing ?? JSValue()),
                try? decoder.decode(NodeRenderMetrics.self, from: nodeMetrics ?? JSValue()),
                try? decoder.decode(PlayerFlowMetrics.self, from: flowMetrics ?? JSValue())
            )
        }
    }

    override public func setup(context: JSContext) {
        super.setup(context: context)

        if let pluginRef = pluginRef {
            self.hooks = MetricsHooks(onRenderEnd: Hook3Decode(baseValue: pluginRef, name: "onRenderEnd"), onFlowBegin: HookDecode(baseValue: pluginRef, name: "onFlowBegin"), onFlowEnd: HookDecode(baseValue: pluginRef, name: "onFlowEnd"))
        }
    }

    public func apply<P>(player: P) where P: HeadlessPlayer {
        guard trackRenderTime, let player = player as? SwiftUIPlayer else { return }
        let renderEnd = self.renderEnd
        player.hooks?.view.tap(name: pluginName, { (view) -> AnyView in
            AnyView(view.onAppear {
                renderEnd()
            })
        })
    }

    /**
     Constructs the MetricsPlugin
     - parameters:
        - trackRenderTime: Whether or not to track render times
        - handler: A handler to receive events when rendering has finished
     */
    public convenience init(trackRenderTime: Bool = true, handler: RenderEndHandler? = nil) {
        self.init(fileName: "MetricsPlugin.native", pluginName: "MetricsPlugin.MetricsCorePlugin")
        self.trackRenderTime = trackRenderTime
        self.onRenderEnd = handler
    }

    public override func getArguments() -> [Any] {
        return [[
            "trackRenderTime": trackRenderTime,
            "onRenderEnd": JSValue(object: onRenderEndJSHandler, in: context) as Any
        ]]
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: MetricsPlugin.self),
            pathComponent: "PlayerUI_MetricsPlugin.bundle"
        )
        #endif
    }

    /**
     Called when the UI has finished rendering
     */
    public func renderEnd() {
        pluginRef?.invokeMethod("renderEnd", withArguments: [])
    }
}

public struct MetricsHooks {
    /// Called when rendering for a node ends
    public let onRenderEnd: Hook3Decode<MetricsTiming, NodeRenderMetrics, PlayerFlowMetrics>
    /// Called when a flow starts
    public let onFlowBegin: HookDecode<PlayerFlowMetrics>
    /// Called when a flow ends 
    public let onFlowEnd: HookDecode<PlayerFlowMetrics>
}

public struct MetricsTiming: Decodable {
    /// Time this duration started (ms)
    public let startTime: Int
    /// The time in (ms) that the process ended
    public let endTime: Int?
    /// The elapsed time of this event (ms)
    public let duration: Int?
    /// Flag set if this is currently in progress
    public let completed: Bool
}

public struct NodeRenderMetrics: Decodable {
    /// The type of the flow-state
    public let stateType: String
    /// the name of the flow-state
    public let stateName: String
    /// Timing representing the initial render
    public let render: MetricsTiming?
    /// An array of timings representing updates to the view
    public let updates: [MetricsTiming]?
}

public struct MetricsFlow: Decodable {
    /// The ID of the flow these metrics are for
    public let id: String
    /// The request time
    public let requestTime: Int?
    /// A timeline of events for each node-state
    public let timeline: [NodeRenderMetrics]
    /// A timing measuring until the first interactive render
    public let interactive: MetricsTiming
    /// Time this duration started (ms)
    public let startTime: Int?
    /// The time in (ms) that the process ended
    public let endTime: Int?
    /// The elapsed time of this event (ms)
    public let duration: Int?
    /// Flag set if this is currently in progress
    public let completed: Bool
}

public struct PlayerFlowMetrics: Decodable {
    /// All metrics about a running flow
    public let flow: MetricsFlow
}

//
//  BaseBeaconPlugin.swift
//  PlayerUI
//
//  Created by Borawski, Harris on 3/11/21.
//

import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
#endif

/**
 Represenation of a Beacon coming from Player
 */
public struct DefaultBeacon: Codable, Hashable {
    /// The action the user performed
    public let action: String
    
    /// The element that performed the action
    public let element: String
    
    /// The ID of the asset triggering the beacon
    public let assetId: String?
    
    /// The ID of the view triggering the beacon
    public let viewId: String?
    
    /// Additional data added from the asset or metaData
    public let data: AnyType?
    
    /// Construct a ``DefaultBeacon``
    /// - Parameters:
    ///   - action: The action the user performed
    ///   - element: The element that performed the action
    ///   - assetId: The ID of the asset triggering the beacon
    ///   - viewId: The ID of the view triggering the beacon
    ///   - data: Additional data added from the asset or metaData
    public init(action: String, element: String, assetId: String?, viewId: String?, data: AnyType?) {
        self.action = action
        self.element = element
        self.assetId = assetId
        self.viewId = viewId
        self.data = data
    }
}

/**
 A Base implementation wrapping @player-ui/beacon-plugin
 Used as a base for framework specific integrations
 */
open class BaseBeaconPlugin<BeaconStruct: Decodable>: JSBasePlugin {
    
    public var hooks: BeaconPluginHooks?
    /// The callback to call when a beacon is fired from the plugin
    public var callback: ((BeaconStruct) -> Void)?
    
    /// BeaconPluginPlugin's to use for this BeaconPlugin
    public var plugins: [JSBasePlugin] = []
    
    /**
     Constructs a BeaconPlugin
     - parameters:
     - context: The context to load the plugin into
     - onBeacon: A callback to receive beacon events
     */
    public convenience init(plugins: [JSBasePlugin] = [], onBeacon: ((BeaconStruct) -> Void)?) {
        self.init(fileName: "BeaconPlugin.native", pluginName: "BeaconPlugin.BeaconPlugin")
        self.callback = onBeacon
        self.plugins = plugins
    }
    
    override open func setup(context: JSContext) {
        super.setup(context: context)
        guard let pluginRef = self.pluginRef else {
            fatalError("pluginRef is nil after setup")
        }
        self.hooks = BeaconPluginHooks(
            buildBeacon: AsyncHook2(baseValue: pluginRef, name: "buildBeacon"),
            cancelBeacon: Hook2(baseValue: pluginRef, name: "cancelBeacon")
        )
    }
    
    override open func getUrlForFile(fileName: String) -> URL? {
#if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
#else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: BaseBeaconPlugin<DefaultBeacon>.self),
            pathComponent: "PlayerUI_BaseBeaconPlugin.bundle"
        )
#endif
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
        let callback: @convention(block) (JSValue?) -> Void = { [weak self] rawBeacon in
            guard
                let object = rawBeacon?.toObject() else {
                print("Failed to convert rawBeacon to object")
                return
            }
            
            print("Raw beacon object: \(object)")
            
            do {
                let data = try JSONSerialization.data(withJSONObject: object)
                print("Serialized data: \(String(data: data, encoding: .utf8) ?? "nil")")
                
                let beacon = try AnyTypeDecodingContext(rawData: data)
                    .inject(to: JSONDecoder())
                    .decode(BeaconStruct.self, from: data)
                
                self?.callback?(beacon)
            } catch {
                print("Error during JSON serialization or deserialization: \(error)")
            }
        }
        let jsCallback = JSValue(object: callback, in: context) as Any
        return [["callback": jsCallback, "plugins": plugins.map { $0.pluginRef }]]
    }
    
    /**
     Function to send a beacon event through the plugin for processing
     - parameters:
     - action: The action that was taken for the beacon
     - args: The context of the beacon
     */
    public func beacon(assetBeacon: AssetBeacon) {
        guard
            let beacon = try? JSONEncoder().encode(assetBeacon),
            let beaconString = String(data: beacon, encoding: .utf8),
            let beaconObject = pluginRef?.context.evaluateScript("(\(beaconString))")
        else { return }
        pluginRef?.invokeMethod("beacon", withArguments: [beaconObject])
    }
    
    public struct BeaconPluginHooks {
        public let buildBeacon: AsyncHook2<JSValue, JSValue>
        public let cancelBeacon: Hook2<JSValue, JSValue>
        
        public init(buildBeacon: AsyncHook2<JSValue, JSValue>, cancelBeacon: Hook2<JSValue, JSValue>) {
            self.buildBeacon = buildBeacon
            self.cancelBeacon = cancelBeacon
        }
    }
}
